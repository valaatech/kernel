// @flow

import type { UniversalEvent } from "~/raem/command";

import PartitionConnection from "~/prophet/api/PartitionConnection";
import thenChainEagerly from "~/tools/thenChainEagerly";
import type { ChronicleEventResult, ChronicleOptions, MediaInfo } from "~/prophet/api/Prophet";

/**
 * The base authority partition connection implementation.
 * Provides all necessary services for local authorities use this directly.
 * Remote authorities extend this class
 *
 * @export
 * @class AuthorityPartitionConnection
 * @extends {PartitionConnection}
 */
export default class AuthorityPartitionConnection extends PartitionConnection {

  isLocallyPersisted () { return this._prophet.isLocallyPersisted(); }
  isPrimaryAuthority () { return this._prophet.isPrimaryAuthority(); }
  isRemoteAuthority () { return this._prophet.isRemoteAuthority(); }

  isConnected () {
    if (!this.isRemoteAuthority()) return true;
    return super.isConnected();
  }

  connect (/* options: ConnectOptions */) {
    return (this._syncedConnection = this);
  }

  async narrateEventLog (): Promise<any> { return {}; }

  chronicleEvents (events: UniversalEvent[], options: ChronicleOptions):
      { eventResults: ChronicleEventResult[] } {
    if (this.isRemoteAuthority()) {
      throw new Error(`${this.constructor.name
          }.chronicleEvents not implemented by remote authority partition "${this.getName()}"`);
    }
    const receivedTruthsProcess = !this.isPrimaryAuthority() ? []
        : this.getReceiveTruths(options.receiveTruths)(events);
    return {
      eventResults: events.map((event, index) => ({
        event,
        getLocallyReceivedEvent: () => thenChainEagerly(
            receivedTruthsProcess,
            (receivedTruths) => receivedTruths[index]),
        getTruthEvent: () => (this.isPrimaryAuthority() ? event : undefined),
      })),
    };
  }

  // Coming from downstream: tries scribe first, otherwise forwards the request to authority.
  // In latter case forwards the result received from authority to Scribe for caching.
  requestMediaContents (mediaInfos: MediaInfo[]): any[] {
    return mediaInfos.map(mediaInfo => Promise.reject(new Error(
        `Authority connection '${this.getName()}' doesn't implement media content requests ('${
            mediaInfo.name}' requested)`)));
  }

  prepareBvob (content: any, mediaInfo?: Object):
      { contentId: string, persistProcess: ?Promise<any> } {
    if (!mediaInfo || !mediaInfo.bvobId) {
      throw new Error("mediaInfo.bvobId not defined in AuthorityProphetConnection");
    }
    return { contentId: mediaInfo.bvobId, persistProcess: undefined };
  }
}
