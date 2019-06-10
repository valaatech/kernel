// @flow

import type { EventBase } from "~/raem/events";

import Connection from "~/sourcerer/api/Connection";
import { ChronicleRequest, ChronicleOptions, ChronicleEventResult, MediaInfo, NarrateOptions }
    from "~/sourcerer/api/types";

import thenChainEagerly, { mapEagerly } from "~/tools/thenChainEagerly";
import { debugObjectType, dumpObject } from "~/tools/wrapError";

/**
 * The base authority partition connection implementation.
 * Provides all necessary services for local authorities use this directly.
 * Remote authorities extend this class
 *
 * @export
 * @class AuthorityConnection
 * @extends {Connection}
 */
export default class AuthorityConnection extends Connection {
  isLocallyPersisted () { return this._sourcerer.isLocallyPersisted(); }
  isPrimaryAuthority () { return this._sourcerer.isPrimaryAuthority(); }
  isRemoteAuthority () { return this._sourcerer.isRemoteAuthority(); }
  getEventVersion () { return this._sourcerer.getEventVersion(); }

  isConnected () {
    if (!this.isRemoteAuthority()) return true;
    return super.isConnected();
  }

  getName () {
    return this.getRawName();
  }

  _doConnect (/* options: ConnectOptions */) {}

  narrateEventLog (options: ?NarrateOptions = {}): Object | Promise<Object> {
    if (this.isRemoteAuthority()) {
      throw new Error(`Failed to narrate events from ${this.getName()}: ${this.constructor.name
          }.narrateEventLog is not implemented`);
    }
    return !options ? undefined : {};
  }

  chronicleEvents (events: EventBase[], options: ChronicleOptions): ChronicleRequest {
    if (this.isRemoteAuthority() && !options.remoteEventsProcess) {
      throw new Error(`Failed to chronicle events to ${this.getName()}: ${this.constructor.name
          }.chronicleEvents not overridden and options.remoteEventsProcess not defined`);
    }
    let rejectedIndex;
    const resultBase = new AuthorityEventResult(null, this, {
      remoteResults: null,
      isPrimary: this.isPrimaryAuthority(),
    });
    resultBase.localProcess = thenChainEagerly(null, this.addChainClockers(2,
        "authority.chronicle.localProcess.ops", [
      function _processRemoteEvents () {
        if (!options.remoteEventsProcess) return undefined;
        return mapEagerly(options.remoteEventsProcess,
            remoteEvent => remoteEvent,
            (error, head, index, remoteEvents, entries, callback, onRejected) => {
              if (rejectedIndex === undefined) rejectedIndex = index;
              remoteEvents[index] = Promise.reject(error);
              return mapEagerly(entries, callback, onRejected, index + 1, remoteEvents);
            });
      },
      function _receiveTruthsLocally (remoteResults) {
        resultBase.remoteResults = remoteResults;
        const truths = (rejectedIndex !== undefined) ? remoteResults.slice(0, rejectedIndex)
            : remoteResults || events;
        if (!truths || !truths.length) return [];
        return resultBase.chronicler.getReceiveTruths(options.receivedTruths)(truths);
      },
      function _finalizeLocallyReceivedTruths (receivedTruths) {
        return (resultBase.localProcess = receivedTruths);
      },
    ]));
    resultBase.truthsProcess = thenChainEagerly(resultBase.localProcess,
        (receivedTruths) => (resultBase.truthsProcess =
            (this.isPrimaryAuthority() && (receivedTruths || events)) || []));
    return {
      eventResults: events.map((event, index) => {
        const ret = Object.create(resultBase); ret.event = event; ret.index = index; return ret;
      }),
    };
  }

  // Coming from downstream: tries scribe first, otherwise forwards the request to authority.
  // In latter case forwards the result received from authority to Scribe for caching.
  requestMediaContents (mediaInfos: MediaInfo[]): any[] {
    return mediaInfos.map(mediaInfo => Promise.reject(new Error(
        `Authority connection '${this.getName()}' doesn't implement content requests (for Media '${
            mediaInfo.name}') and content not found in local cache`)));
  }

  prepareBvob (content: any, mediaInfo?: Object):
      Promise<Object> | { contentHash: string, persistProcess: ?Promise<any> } {
    const connection = this;
    const contentHash = mediaInfo && (mediaInfo.contentHash || mediaInfo.bvobId);
    const wrap = new Error(`prepareBvob(${contentHash || "<undefined>"})`);
    try {
      if (!contentHash) throw new Error("mediaInfo.contentHash not defined");
      let persistProcess = contentHash;
      if (this.isRemoteAuthority()) {
        const error = new Error(`prepareBvob not implemented by remote authority partition`);
        error.isRetryable = false;
        persistProcess = Promise
            .reject(this.wrapErrorEvent(error, new Error("prepareBvob")))
            .catch(errorOnAuthorityConnectionPrepareBvob);
      }
      return { contentHash, persistProcess };
    } catch (error) { return errorOnAuthorityConnectionPrepareBvob(error); }
    function errorOnAuthorityConnectionPrepareBvob (error) {
      throw connection.wrapErrorEvent(error, wrap,
          "\n\tcontent:", debugObjectType(content),
          "\n\tmediaInfo:", ...dumpObject(mediaInfo),
          "\n\tconnection:", ...dumpObject(connection));
    }
  }
}

export class AuthorityEventResult extends ChronicleEventResult {
  getComposedEvent () {
    return thenChainEagerly(this.localProcess,
        receivedEvents => receivedEvents[this.index],
        this.onError);
  }
  getTruthEvent () {
    if (!this.isPrimary) {
      throw new Error(`Non-primary authority '${this.chronicler.getName()
          }' cannot deliver truths (by default)`);
    }
    if (!this.truthsProcess) return this.getComposedEvent(); // implies: not remote
    return thenChainEagerly(this.truthsProcess,
        truthEvents => (this.remoteResults || truthEvents)[this.index],
        this.onError);
  }
}