// @flow

import { created } from "~/raem/events";
import { vRef } from "~/raem/VRL";
import { valueExpression } from "~/script";
import VALEK from "~/engine/VALEK";
import { testRootId } from "~/sourcerer/test/SourcererTestHarness";

export default [{
  type: "TRANSACTED",
  actions: [
    created({ id: ["test"], typeName: "Entity", initialState: {
      owner: [testRootId],
      name: "testName",
    }, }),
    created({ id: ["ownling_prototype"], typeName: "Entity", initialState: {
      owner: ["test"],
      name: "ownlingPrototype",
    }, }),
    created({ id: ["ownling"], typeName: "Entity", initialState: {
      owner: ["test"],
      name: "ownlingName",
    }, }),
    created({ id: ["creator"], typeName: "Entity", initialState: {
      owner: ["test"],
      name: "ownlingCreator",
    }, }),
    created({ id: ["creator-counter"], typeName: "Property", initialState: {
      name: "counter",
      owner: vRef("creator", "properties"),
      value: valueExpression(0),
    }, }),
    created({ id: ["creator-prototype"], typeName: "Property", initialState: {
      name: "template",
      owner: vRef("creator", "properties"),
      value: valueExpression(vRef("ownling_prototype")),
    }, }),
    created({ id: ["ownling-counter"], typeName: "Property", initialState: {
      name: "ownling_counter",
      owner: vRef("ownling", "properties"),
      value: valueExpression(10),
    }, }),
    created({ id: ["ownling-counter_plus_seven"], typeName: "Property", initialState: {
      name: "ownling_counter_plus_seven",
      owner: vRef("ownling", "properties"),
      value: valueExpression(VALEK.propertyValue("ownling_counter").add(7)),
    }, }),
    created({ id: ["creator-ownling"], typeName: "Property", initialState: {
      name: "pointer_to_ownling",
      owner: vRef("creator", "properties"),
      value: valueExpression(vRef("ownling")),
    }, }),
    created({ id: ["test+1"], typeName: "Entity", initialState: {
      name: "testInstance",
      owner: [testRootId],
      instancePrototype: ["test"],
    }, }),
  ]
}];
