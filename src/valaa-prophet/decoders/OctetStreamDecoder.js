// @flow

import MediaDecoder from "~/valaa-prophet/api/MediaDecoder";

export default class OctetStreamDecoder extends MediaDecoder {
  static mediaTypes = [
    { type: "application", subtype: "octet-stream" },
  ];

  decode (buffer: ArrayBuffer): any {
    return buffer;
  }
}
