// @flow

import type { EventBase } from "~/raem/events";
import { hasScheme } from "~/raem/ValaaURI";

import PartitionConnection from "~/prophet/api/PartitionConnection";
import { ConnectOptions, MediaInfo, ReceiveEvents, RetrieveMediaBuffer } from "~/prophet/api/types";

import DecoderArray from "~/prophet/Oracle/DecoderArray";
import upgradeEventTo0Dot2 from "~/prophet/tools/event-version-0.2/upgradeEventTo0Dot2";

import { DelayedQueue, dumpObject, thenChainEagerly } from "~/tools";

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
  constructor ({ authorityProphet, ...rest }: Object) {
    super(rest);
    this._authorityProphet = authorityProphet;
    this._decoderArray = new DecoderArray({
      name: `Decoders of ${this.getName()}`,
      fallbackArray: this.getProphet().getDecoderArray(),
    });
  }

  _doConnect (options: ConnectOptions) {
    // Handle step 2. of the acquirePartitionConnection first narration
    // logic (defined in PartitionConnection.js) and begin I/O bound(?)
    // scribe event log narration in parallel to the authority
    // proxy/connection creation.
    this.setUpstreamConnection(this._authorityProphet.acquirePartitionConnection(
        this.getPartitionURI(), {
          narrateOptions: false,
          subscribeEvents: (options.narrateOptions === false) && options.subscribeEvents,
          receiveTruths: this.getReceiveTruths(options.receiveTruths),
        }));
    return thenChainEagerly(
        this._upstreamConnection.getActiveConnection(),
        () => ((options.narrateOptions === false) ? {} : this.narrateEventLog({
          subscribeEvents: options.subscribeEvents,
          ...options.narrateOptions,
        })));
  }

  receiveTruths (truths: EventBase[], retrieveMediaBuffer: RetrieveMediaBuffer,
      downstreamReceiveTruths: ?ReceiveEvents, type: string = "receiveTruths",
  ): Promise<(Promise<EventBase> | EventBase)[]> {
    try {
      if (!downstreamReceiveTruths) {
        throw new Error(`INTERNAL ERROR: downstreamReceiveTruths was not defined`);
      }
      return downstreamReceiveTruths(
          truths.map(event => upgradeEventTo0Dot2(this, event)),
          retrieveMediaBuffer);
    } catch (error) {
      throw this.wrapErrorEvent(error, new Error(type),
          "\n\ttruths:", ...dumpObject(truths),
          "\n\tretrieveMediaBuffer:", ...dumpObject(retrieveMediaBuffer));
    }
  }

  // Coming from downstream: tries scribe first, otherwise forwards the request to authority.
  // In latter case forwards the result received from authority to Scribe for caching.
  requestMediaContents (mediaInfos: MediaInfo[]): any[] {
    const connection = this;
    const urlRequests = new DelayedQueue();
    const bufferRequests = new DelayedQueue();
    const ret = mediaInfos.map(mediaInfo => {
      const wrap = new Error(`requestMediaContents().mediaInfo["${
          mediaInfo.name || `unnamed media`}"]`);
      try {
        const contentHash = mediaInfo.contentHash || mediaInfo.bvobId;
        if (!contentHash) {
          if (!mediaInfo.sourceURL) return undefined;
          const sourceURI = mediaInfo.sourceURL;
          if (mediaInfo.asURL) {
            if (mediaInfo.type) {
              throw new Error(`Cannot explicitly decode sourceURL-based content as '${
                  mediaInfo.mime}' typed URL`);
            }
            if (hasScheme(sourceURI, "http") || hasScheme(sourceURI, "https")) {
              return mediaInfo.sourceURL;
            }
            // TODO(iridian): Implement schema-based request forwarding to remote authorities
            throw new Error(`non-http(s) mediaInfo.sourceURL's not implemented, got '${
                sourceURI}'`);
          }
          // TODO(iridian): Implement schema-based request forwarding to authorities
          // TODO(iridian): Implement straight mediaInfo.sourceURL retrieval if the field is
          // present, using mediaInfo.type/subtype as the request ContentType.
          throw new Error(`direct retrieval not implemented for mediaInfo.sourceURL '${
              sourceURI}'`);
        }
        if (mediaInfo.asURL) return urlRequests.push(mediaInfo)[0];
        let decoder;
        if (mediaInfo.type
            && !((mediaInfo.type === "application") && (mediaInfo.subtype === "octet-stream"))) {
          decoder = connection._decoderArray.findDecoder(mediaInfo);
          if (!decoder) throw new Error(`Can't find decoder for ${mediaInfo.mime}`);
          if (mediaInfo.decodingCache) {
            const decoding = mediaInfo.decodingCache.get(decoder);
            if (decoding !== undefined) return decoding;
          }
        }
        // Split requests into three sets: one for URL's, one for actual contents and one for
        // just immediate decoding for buffer content that is already locally available.
        return thenChainEagerly(
            mediaInfo.buffer || bufferRequests.push(mediaInfo)[0],
            buffer => {
              if (buffer === undefined) return undefined;
              mediaInfo.buffer = buffer;
              if (!decoder) return buffer;
              const name = mediaInfo.name ? `'${mediaInfo.name}'` : `unnamed media`;
              const decoding = decoder.decode(buffer,
                  { mediaName: name, partitionName: connection.getName() });
              if (mediaInfo.decodingCache) mediaInfo.decodingCache.set(decoder, decoding);
              return decoding;
            },
            errorOnOracleConnectionRequestMediaContentForInfo);
      } catch (error) {
        return errorOnOracleConnectionRequestMediaContentForInfo(error);
      }
      function errorOnOracleConnectionRequestMediaContentForInfo (error) {
        return Promise.reject(connection.wrapErrorEvent(error, wrap,
            "\n\tmediaRef:", ...dumpObject(mediaInfo.mediaRef),
            "\n\tmediaInfo:", ...dumpObject(mediaInfo)));
      }
    });
    if (urlRequests.length) {
      urlRequests.resolve(connection.getUpstreamConnection()
          .requestMediaContents([...urlRequests]));
    }
    if (bufferRequests.length) {
      bufferRequests.resolve(connection.getUpstreamConnection()
          .requestMediaContents([...bufferRequests]));
    }
    return ret;
  }
}
