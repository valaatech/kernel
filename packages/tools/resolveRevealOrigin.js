Object.defineProperty(exports, "__esModule", { value: true });

const path = require("path");
const inBrowser = require("../gateway-api/inBrowser").default;

exports.default = function resolveRevealOrigin (
    reference, siteRoot, revelationRoot, domainRoot, currentDir) {
  if (reference[0] === "/") return path.join((siteRoot || ""), reference);
  if (reference[0] === ".") return path.join((currentDir || revelationRoot), reference);
  if ((reference[0] !== "<") || (reference[reference.length - 1] !== ">")) return reference;
  const uri = reference.slice(1, -1);
  if (uri[0] === "/") {
    if (inBrowser()) return uri;
    return path.join(domainRoot || siteRoot, uri.slice(1));
  }
  if (uri.match(/^[^/]*:/)) return uri; // absolute-ref uri: global reference
  // relative-path URI ref - revelation root relative ref
  return path.join(revelationRoot, uri);
};