// @flow

import { TextEncoder, TextDecoder } from "text-encoding";
import base64js from "base64-js";

export function base64Encode (data: any, encoding: string = "utf-8") {
  const bytes = new TextEncoder(encoding).encode(data);
  return base64js.fromByteArray(bytes);
}

export function base64Decode (base64Data: string, encoding: string = "utf-8") {
  const bytes = base64js.toByteArray(base64Data);
  return new TextDecoder(encoding).decode(bytes);
}
