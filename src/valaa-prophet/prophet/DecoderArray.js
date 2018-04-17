// @flow

import mergeWith from "lodash/mergeWith";

import type { MediaInfo } from "~/valaa-prophet/api/Prophet";
import { LogEventGenerator } from "~/valaa-tools";

export default class DecoderArray extends LogEventGenerator {
  _decodersByType: ?{ [string]: { [string]: Object } };

  constructor (options: Object = {}) {
    if (!options.logger && options.fallbackArray) {
      options.logger = options.fallbackArray.getLogger();
    }
    super(options);
    this._fallbackArray = options.fallbackArray;
  }

  addDecoder (decoder: Object) {
    mergeWith(this._decodersByType || (this._decodersByType = {}),
        decoder.getByMediaTypeLookup(),
        (targetEntry, sourceEntry) => ((Array.isArray(targetEntry) || Array.isArray(sourceEntry))
            ? _asSequence(targetEntry).concat(_asSequence(sourceEntry))
            : undefined));
  }

  findDecoder (mediaInfo: MediaInfo) {
    if (this._decodersByType) {
      // Find by exact match first
      const ret = this._findByTypeAndSubType(mediaInfo, mediaInfo.type, mediaInfo.subtype)
      // Find by main type match second
          || this._findByTypeAndSubType(mediaInfo, mediaInfo.type, "")
      // Find by subtype match third
          || this._findByTypeAndSubType(mediaInfo, "", mediaInfo.subtype)
      // Find by generic matchers the last
          || this._findByTypeAndSubType(mediaInfo, "", "");
      if (ret) return ret;
    }
    // Delegate to the next circle in line to see if they can decode this media type
    return (this._fallbackArray && this._fallbackArray.findDecoder(mediaInfo));
  }

  _findByTypeAndSubType (mediaInfo: MediaInfo, type: string, subtype: string) {
    for (const decodersBySubType of _asSequence(this._decodersByType[type])) {
      for (const decoder of _asSequence(decodersBySubType[subtype])) {
        if (decoder.canDecode(mediaInfo)) return decoder;
      }
    }
    return undefined;
  }
}

function _asSequence (candidate: any) {
  return (typeof candidate === "undefined") || (candidate === null) ? []
      : Array.isArray(candidate) ? candidate
      : [candidate];
}
