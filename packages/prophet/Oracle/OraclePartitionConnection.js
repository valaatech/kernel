// @flow

import type Command from "~/raem/command";
import { VRef } from "~/raem/ValaaReference";

import PartitionConnection from "~/prophet/api/PartitionConnection";
import type { NarrateOptions, MediaInfo, RetrieveMediaContent } from "~/prophet/api/Prophet";

import { dumpObject, thenChainEagerly } from "~/tools";

import { _connect, _narrateEventLog } from "./_connectionOps";
import { _onConfirmTruth } from "./_downstreamOps";
import { _readMediaContent, _getMediaURL, _prepareBlob } from "./_mediaOps";

/**
 * The nexus connection object, which consolidates the local scribe connections and the possible
 * authority connection.
 *
 * Unconditionally relies on scribe connection: any failures (like running over quota) will flow
 * through to front-end.
 * Unconditionally relies on authority connection also.
 * TODO(iridian): The authority connection should not be relied upon, but reconnection support needs
 * to be added.
 *
 * @export
 * @class OraclePartitionConnection
 * @extends {PartitionConnection}
 */
export default class OraclePartitionConnection extends PartitionConnection {
  _lastAuthorizedEventId: number;
  _downstreamTruthQueue: Object[];
  _authorityRetrieveMediaContent: ?RetrieveMediaContent;
  _narrationRetrieveMediaContent: ?RetrieveMediaContent;

  constructor (options: Object) {
    super(options);
    this._lastAuthorizedEventId = -1;
    this._downstreamTruthQueue = [];
    this._isConnected = false;
  }

  getScribeConnection (): PartitionConnection {
    return this._upstreamConnection;
  }

  getRetrieveMediaContent () {
    return this._narrationRetrieveMediaContent || this._authorityRetrieveMediaContent;
  }

  isConnected (): boolean {
    return this._isConnected;
  }

  /**
   * Asynchronous operation which activates the connection to the Scribe and loads its metadatas,
   * initiates the authority connection and narrates any requested events before finalizing.
   *
   * The initial narration looks for the requested events in following order:
   * 1. initialNarrateOptions.eventLog
   * 2. scribe in-memory and IndexedDB caches
   * 3. authority connection.narrateEventLog (only if initialNarrateOptions.lastEventId is given)
   *
   * If lastEventId is not specified, all the explicit eventLog and local cache events (starting
   * from the optional firstEventId) are narrated.
   *
   *
   * @param {NarrateOptions} initialNarrateOptions
   *
   * @memberof OraclePartitionConnection
   */
  async connect (initialNarrateOptions: NarrateOptions) {
    const onConnectData = { ...initialNarrateOptions };
    try {
      if (this.getDebugLevel()) {
        this.warnEvent("\n\tBegun initializing connection with options", initialNarrateOptions,
            ...dumpObject(this));
      }
      const ret = _connect(this, initialNarrateOptions, onConnectData);
      if (this.getDebugLevel()) {
        this.warnEvent("\n\tDone initializing connection with options", initialNarrateOptions,
            "\n\tinitial narration:", ret);
      }
      return ret;
    } catch (error) {
      throw this.wrapErrorEvent(error, "connect",
          "\n\tonConnectData:", onConnectData);
    }
  }

  async narrateEventLog (options: NarrateOptions = {}): Promise<any> {
    const ret = {};
    const retrievals = {};
    try {
      return await _narrateEventLog(this, options, ret, retrievals);
    } catch (error) {
      throw this.wrapErrorEvent(error, "narrateEventLog()",
          "\n\toptions:", options,
          "\n\tcurrent ret:", ret);
    } finally {
      if (options.retrieveMediaContent) {
        delete this._narrationRetrieveMediaContent;
      }
    }
  }

  async _onConfirmTruth (originName: string, authorizedEvent: Object): Promise<Object> {
    const partitionData = authorizedEvent.partitions &&
        authorizedEvent.partitions[this.partitionRawId()];
    try {
      if (!partitionData) {
        throw new Error(`authorizedEvent is missing partition info for ${this.debugId()}`);
      }
      return _onConfirmTruth(this, originName, authorizedEvent, partitionData);
    } catch (error) {
      throw this.wrapErrorEvent(error, `_onConfirmTruth('${originName}')`,
          "\n\toriginName:", originName,
          "\n\teventId:", partitionData && partitionData.eventId,
          "\n\tauthorizedEvent:", ...dumpObject(authorizedEvent),
          "\n\tthis:", ...dumpObject(this));
    }
  }

  claimCommandEvent (command: Command) {
    return this.getScribeConnection().claimCommandEvent(command, this.getRetrieveMediaContent());
  }

  _preAuthorizeCommand = (preAuthorizedEvent: Object) =>
      this._onConfirmTruth("preAuthorizer", preAuthorizedEvent)

  // Coming from downstream: tries scribe first, otherwise forwards the request to authority.
  // In latter case forwards the result received from authority to Scribe for caching.
  readMediaContent (mediaId: VRef, mediaInfo?: MediaInfo): any {
    let ret;
    let actualInfo;
    try {
      actualInfo = mediaInfo || this.getScribeConnection().getMediaInfo(mediaId);
      ret = _readMediaContent(this, mediaId, mediaInfo, actualInfo);
      if (ret === undefined) return ret;
    } catch (error) { throw onError.call(this, error); }
    // Store the content to Scribe as well (but not to authority): dont wait for completion
    thenChainEagerly(ret,
        (content) => this.prepareBlob(content, actualInfo, { noRemotePersist: true }),
        onError.bind(this));
    return ret;
    function onError (error) {
      return this.wrapErrorEvent(error, `readMediaContent(${
              (actualInfo && actualInfo.name)
                  ? `'${actualInfo.name}'` : `unnamed media`})`,
          "\n\tmediaId:", mediaId,
          "\n\tactualMediaInfo:", actualInfo,
          "\n\tresult candidate:", ret);
    }
  }

  // Coming from downstream: tries scribe first, otherwise forwards the request to authority.
  getMediaURL (mediaId: VRef, mediaInfo?: MediaInfo): any {
    let actualInfo;
    try {
      actualInfo = mediaInfo || this.getScribeConnection().getMediaInfo(mediaId);
      return _getMediaURL(this, mediaId, mediaInfo, actualInfo);
    } catch (error) {
      throw this.wrapErrorEvent(error, `getMediaURL(${
              (mediaInfo && mediaInfo.name) ? `'${mediaInfo.name}'` : `unnamed media`})`,
          "\n\tmediaId:", mediaId,
          "\n\tactual mediaInfo:", actualInfo);
    }
  }

  // Coming from downstream: stores Media content in Scribe and uploads it to possible remote
  // uploads pool.
  prepareBlob (content: any, mediaInfo: Object, options: any = {}):
      { contentId: string, persistProcess: ?Promise<any> } {
    try {
      return _prepareBlob(this, content, mediaInfo, options);
    } catch (error) {
      throw this.wrapErrorEvent(error, `prepareBlob()`,
          "\n\tmediaInfo:", ...dumpObject(mediaInfo),
      );
    }
  }
}
