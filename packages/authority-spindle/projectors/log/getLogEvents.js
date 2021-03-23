// @flow

import valosheath from "@valos/gateway-api/valosheath";

import type { PrefixRouter, Route } from "~/web-spindle/MapperService";

const { dumpObject, thenChainEagerly } = valosheath.require("@valos/tools");

export default function createProjector (router: PrefixRouter, route: Route) {
  return {
    requiredRules: ["routeRoot"],
    valueAssertedRules: ["chroniclePlot", "indexRange"],

    prepare () {
      this.runtime = router.createProjectorRuntime(this, route);
    },

    preload () {
      return router.preloadRuntimeResources(this, this.runtime);
    },

    handler (request, reply) {
      router.infoEvent(1, () => [`${this.name}:`,
        "\n\trequest.params:", ...dumpObject(request.params),
        "\n\trequest.query:", ...dumpObject(request.query),
        "\n\trequest.cookies:", ...dumpObject(Object.keys(request.cookies || {})),
      ]);
      const valkOptions = router.buildRuntimeVALKOptions(this, this.runtime, request, reply);
      if (router.presolveRulesToScope(this.runtime, valkOptions)) {
        router.warnEvent(1, () =>
            [`RUNTIME RULE FAILURE in ${router._routeName(this.runtime.route)}.`]);
        return false;
      }
      const scope = valkOptions.scope;
      router.infoEvent(2, () => [`${this.name}:`,
        "\n\trequest.body:", ...dumpObject(request.body),
        "\n\tresolvers:", ...dumpObject(this.runtime.ruleResolvers),
        "\n\tchroniclePlot:", ...dumpObject(scope.chroniclePlot),
        "\n\tindexRange:", ...dumpObject(scope.indexRange),
      ]);
      // const {} = this.runtime.ruleResolvers;

      const wrap = new Error(this.name);

      scope.connection = router.getDiscourse().getSourcerer()
          .sourcerChronicle(this.authorityBase + scope.chroniclePlot);

      // valkOptions.discourse = router.getDiscourse().acquireFabricator();
      return thenChainEagerly(scope.connection.asSourceredConnection(), [
        connection => {
          // Add or validate body event index to equal scope.eventIndex
          return connection.narrateEventLog({
            eventIdBegin: scope.eventIndex,
            eventIdEnd: scope.eventIndex,
            commands: false,
          });
        },
        // () => valkOptions.discourse.releaseFabricator(),
        (sections) => {
          // Flatten sections and pick correct event
          reply.code(200);
          reply.send(sections);
          router.infoEvent(2, () => [
            `${this.name}:`,
            "\n\tsections:", ...dumpObject(sections),
          ]);
          return true;
        },
      ], (error) => {
        throw router.wrapErrorEvent(error, 1, wrap,
          "\n\trequest.query:", ...dumpObject(request.query),
          "\n\trequest.body:", ...dumpObject(request.body),
          "\n\tscope.resource:", ...dumpObject(scope.resource),
          "\n\tprojectorRuntime:", ...dumpObject(this.runtime),
        );
      });
    },
  };
}
