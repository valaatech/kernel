// @flow

import path from "path";

const valosheath = require("~/gateway-api/valosheath").default;

export default valosheath.exportSpindle({
  name: "@valos/rest-api-spindle",

  onViewAttached (view, viewName) {
    const patchWith = require("@valos/tools/patchWith").default;
    const MapperService = require("./fastify/MapperService").default;
    const configRequire = (module) =>
        valosheath.require(path.isAbsolute(module) ? module : path.join(process.cwd(), module));

    const { service, prefixes } = require(`${process.cwd()}/toolsets.json`)[this.name];
    const options = patchWith({
      name: `${viewName} REST API Server`,
      prefixes: {},
    }, service, {
      require: configRequire,
    });
    options.view = view;
    options.viewName = viewName;
    Object.entries(prefixes).forEach(([prefix, { api, extensions }]) => {
      const prefixAPI = options.prefixes[prefix] = patchWith(options.prefixes[prefix] || {}, [
        api,
        ...[].concat(extensions).map(extension => (typeof extension !== "string"
            ? extension
            : require(extension).api)),
      ], {
        require: configRequire,
      });
      if (prefixAPI.identity) {
        prefixAPI.identity = Object.assign(Object.create(valosheath.identity), prefixAPI.identity);
      }
    });
    view._restAPIService = new MapperService(options);
    return view._restAPIService.start();
  },
});