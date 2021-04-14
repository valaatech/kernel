// @flow

import valosheath from "@valos/gateway-api/valosheath";

import { swapAspectRoot } from "~/sourcerer/tools/EventAspects";
import type { PrefixRouter, Route } from "~/web-spindle/MapperService";
import { _prepareChronicleRequest } from "../_common";

const { dumpObject, thenChainEagerly } = valosheath.require("@valos/tools");

export default function createProjector (router: PrefixRouter, route: Route) {
  return {
    requiredRules: ["routeRoot", "authorityURI"],
    runtimeRules: ["headers", "startIndex", "endIndex"],
    valueAssertedRules: ["chroniclePlot"],

    prepare () {
      this.runtime = router.createProjectorRuntime(this, route);
    },

    preload () {
      return router.preloadRuntimeResources(this, this.runtime);
    },

    handler (request, reply) {
      const { valkOptions, scope /* , discourse, chronicleURI */ } =
          _prepareChronicleRequest(router, this, request, reply);
      if (!valkOptions) return false;

      router.infoEvent(2, () => [`${this.name}:`,
        "\n\trequest.body:", ...dumpObject(request.body),
        "\n\tresolvers:", ...dumpObject(this.runtime.ruleResolvers),
        "\n\tchroniclePlot:", ...dumpObject(scope.chroniclePlot),
        "\n\tindexRange:", ...dumpObject(scope.indexRange),
      ]);
      // const {} = this.runtime.ruleResolvers;

      const eventIdBegin = !scope.startIndex ? 0 : parseInt(scope.startIndex.slice(2), 10);
      const eventIdEnd = !scope.endIndex ? undefined : parseInt(scope.endIndex.slice(2), 10);

      return thenChainEagerly(scope.connection.asSourceredConnection(), [
        connection => connection.narrateEventLog({ eventIdBegin, eventIdEnd, commands: false }),
        // () => valkOptions.discourse.releaseFabricator(),
        (sections) => {
          const eventResults = []
              .concat(...Object.values(sections))
              .sort((a, b) => a.aspects.log.index - b.aspects.log.index)
              .map(event => swapAspectRoot("delta", event, "event"));
          reply.code(200);
          reply.send(JSON.stringify(eventResults));
          router.infoEvent(2, () => [
            `${this.name}:`,
            "\n\teventResults:", ...dumpObject(eventResults),
          ]);
          return true;
        },
      ], (error) => {
        throw router.wrapErrorEvent(error, 1, error.chainContextName(this.name),
          "\n\trequest.query:", ...dumpObject(request.query),
          "\n\trequest.body:", ...dumpObject(request.body),
          "\n\tscope.resource:", ...dumpObject(scope.resource),
          "\n\tprojectorRuntime:", ...dumpObject(this.runtime),
        );
      });
    },
  };
}
