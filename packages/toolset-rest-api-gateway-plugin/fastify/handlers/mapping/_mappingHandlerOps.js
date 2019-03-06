// @flow

import { _addToRelationsSourceSteps } from "../_handlerOps";

export function _createTargetedToMapping (server, route, toTargetId) {
  const { toMappingFields, relationsStepIndex } =
      _createTargetedToMappingFields(server, route, toTargetId);
  toMappingFields.splice(-2, 1);
  return {
    toMapping: toMappingFields,
    relationsStepIndex,
  };
}

export function _createTargetedToMappingFields (server, route, toTargetId) {
  const { toMappingsResults, relationsStepIndex } = _createToMappingsParts(server, route);
  toMappingsResults.splice(relationsStepIndex + 1, 0,
      ["~filter", ["~==", ["~->:target:rawId"], toTargetId]]);
  return {
    toMappingFields: [...toMappingsResults, 0],
    relationsStepIndex,
  };
}

export function _createToMappingsParts (server, route) {
  const toMappingsResults = ["§->"];
  _addToRelationsSourceSteps(server, route.config.resourceSchema, route.config.mappingName,
      toMappingsResults);
  server.buildKuery(route.config.relationSchema, toMappingsResults);
  const relationsStepIndex = toMappingsResults.indexOf("relations");
  if (!(relationsStepIndex >= 0)) {
    throw new Error(`Could not find 'relations' step from kuery built from relationSchema while${
        ""} preparing main mapping kuery`);
  }
  return {
    toMappingsResults,
    relationsStepIndex,
  };
}