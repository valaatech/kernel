import { created, fieldsSet, transacted } from "~/raem/events";

import { vRef } from "~/raem/VRL";

import getObjectField from "~/raem/state/getObjectField";
import { tryObjectTransient } from "~/raem/state/getObjectTransient";
import { createGhostRawId } from "~/raem/state/GhostPath";

import { createMaterializeGhostPathAction, createMaterializeGhostAction }
    from "~/raem/tools/denormalized/ghost";
import { createRAEMTestHarness } from "~/raem/test/RAEMTestHarness";

describe("CREATED with instancePrototype", () => {
  const createBlockA = [
    created({ id: ["A_grandparent"], typeName: "TestThing" }),
    created({ id: ["A_parent"], typeName: "TestThing", initialState: {
      parent: ["A_grandparent"],
    }, }),
    created({ id: ["A_child1"], typeName: "TestThing", initialState: {
      parent: ["A_parent"],
      name: "child1",
    }, }),
    created({ id: ["A_child2"], typeName: "TestThing", initialState: {
      parent: ["A_parent"],
    }, }),
    created({ id: ["A_childGlue"], typeName: "TestGlue", initialState: {
      source: ["A_child1"], target: ["A_child2"], position: { x: 0, y: 1, z: null },
    }, }),
    created({ id: ["A_childDataGlue"], typeName: "TestDataGlue", initialState: {
      source: ["A_child1"], target: ["A_child2"],
    }, }),
    fieldsSet({ id: ["A_child1"], typeName: "TestThing",
      sets: { targetDataGlues: ["A_childDataGlue"], },
    }),
    fieldsSet({ id: ["A_child2"], typeName: "TestThing",
      sets: { sourceDataGlues: ["A_childDataGlue"], },
    }),
  ];

  const createGrandparentInstance = [
    created({ id: ["A_grandparentInstance"], typeName: "TestThing",
      initialState: { instancePrototype: ["A_grandparent"] },
    }),
  ];

  const createGrandparentInstanceInstance = [
    created({ id: ["A_grandparentInstanceInstance"], typeName: "TestThing",
      initialState: { instancePrototype: ["A_grandparentInstance"] },
    }),
  ];

  const createParentInstance = [
    created({ id: ["A_parentInstance"], typeName: "TestThing",
      initialState: { instancePrototype: ["A_parent"], owner: ["A_grandparent"] },
    }),
  ];

  const createChild1Instance = [
    created({ id: ["A_child1Instance"], typeName: "TestThing",
      initialState: { instancePrototype: ["A_child1"], owner: ["A_parent"] },
    }),
  ];
  /*
  const createChild1InstanceInGrandparent = [
    created({ id: ["A_child1Instance"], typeName: "TestThing",
      initialState: { instancePrototype: ["A_child1Instance"], owner: ["A_grandparent"] },
    }),
  ];
  */

  it("sets the instance prototype correctly", async () => {
    const harness = createRAEMTestHarness({ verbosity: 0 }, createBlockA, createChild1Instance);
    const child1Instance = tryObjectTransient(harness.getValker(), "A_child1Instance", "TestThing");
    expect(child1Instance.get("prototype").toJSON())
        .toEqual(vRef("A_child1", "instances").toJSON());
    expect(harness.run(child1Instance, "prototype").rawId())
        .toEqual("@$~raw.A_child1@@");
  });

  it("sets instance owner explicitly to the owner of the prototype", async () => {
    const harness = createRAEMTestHarness({ verbosity: 0 }, createBlockA, createChild1Instance);
    const child1Instance = tryObjectTransient(harness.getValker(), "A_child1Instance", "TestThing");
    expect(child1Instance.get("owner").toJSON())
        .toEqual(vRef("A_parent", "unnamedOwnlings").toJSON());
    expect(harness.run(child1Instance, "parent"))
        .toEqual(undefined);
    expect(harness.run(vRef("A_parent"), ["§->", "unnamedOwnlings", 0]).rawId())
        .toEqual("@$~raw.A_child1Instance@@");
  });

  it("forwards non-mutated instance leaf property access to the prototype", async () => {
    const harness = createRAEMTestHarness({ verbosity: 0 }, createBlockA, createChild1Instance);
    const child1Instance = tryObjectTransient(harness.getValker(), "A_child1Instance", "TestThing");
    expect(getObjectField(harness.corpus, child1Instance, "name"))
        .toEqual("child1");
    expect(harness.run(child1Instance, "name"))
        .toEqual("child1");
  });

  it("doesn't forward mutated instance leaf property access to the prototype", async () => {
    const harness = createRAEMTestHarness({ verbosity: 0 }, createBlockA, createChild1Instance, [
      fieldsSet({ id: ["A_child1Instance"], typeName: "TestThing",
        sets: { name: "child1Instance", },
      }),
      fieldsSet({ id: ["A_child1"], typeName: "TestThing",
        sets: { name: "child1Mutated", },
      }),
    ]);
    const child1Instance = tryObjectTransient(harness.getValker(), "A_child1Instance", "TestThing");
    expect(getObjectField(harness.corpus, child1Instance, "name"))
        .toEqual("child1Instance");
    expect(harness.run(child1Instance, "name"))
        .toEqual("child1Instance");
  });

  it("materializes ghost resources accessed with ghostPath", async () => {
    const harness = createRAEMTestHarness({ verbosity: 0 }, createBlockA, createParentInstance);
    harness.proclaimTestEvent(transacted({ actions:
        harness.run(vRef("A_parent"), "children")
            .map(child => createMaterializeGhostPathAction(harness.getValker(),
                child.getGhostPath()
                    .withNewGhostStep("@$~raw.A_parent@@", "@$~raw.A_parentInstance@@")))
    }));
    const child1InParentInstanceId = createGhostRawId(
        "@$~raw.A_child1@@", "@$~raw.A_parentInstance@@");
    const child2InParentInstanceId = createGhostRawId(
        "@$~raw.A_child2@@", "@$~raw.A_parentInstance@@");
    expect(tryObjectTransient(harness.getValker(), child1InParentInstanceId, "TestThing"))
        .toBeTruthy();
    expect(tryObjectTransient(harness.getValker(), child2InParentInstanceId, "TestThing"))
        .toBeTruthy();
  });

  it("doesn't materialize the ghost grandling owner when materializing the grandling", async () => {
    const harness = createRAEMTestHarness({ verbosity: 0 }, createBlockA,
        createGrandparentInstance);
    harness.proclaimTestEvent(transacted({ actions:
        harness.run(vRef("A_grandparent"),
                ["§->", "children", 0, "children"])
            .map(grandling => createMaterializeGhostPathAction(harness.getValker(),
                grandling.getGhostPath()
                    .withNewGhostStep("@$~raw.A_grandparent@@", "@$~raw.A_grandparentInstance@@")))
    }));
    const parentInGrandparentInstanceId = createGhostRawId(
          "@$~raw.A_parent@@", "@$~raw.A_grandparentInstance@@");
    expect(tryObjectTransient(harness.getValker(), parentInGrandparentInstanceId, "TestThing"))
        .toBeFalsy();
  });

  it("materializes the ghost grandling from transient kuery result ghost resource", async () => {
    const harness = createRAEMTestHarness({ verbosity: 0 }, createBlockA,
        createGrandparentInstance);
    const ghostGrandlings = harness.run(vRef("A_grandparentInstance"),
        ["§->", "children", 0, "children"]);
    expect(ghostGrandlings[0].rawId())
        .toEqual(createGhostRawId("@$~raw.A_child1@@", "@$~raw.A_grandparentInstance@@"));
    expect(ghostGrandlings[1].rawId())
        .toEqual(createGhostRawId("@$~raw.A_child2@@", "@$~raw.A_grandparentInstance@@"));
    harness.proclaimTestEvent(transacted({ actions:
        ghostGrandlings.map(
            ghostGrandling => createMaterializeGhostAction(harness.getValker(), ghostGrandling))
    }));
    const parentInGrandparentInstanceId = createGhostRawId(
        "@$~raw.A_parent@@", "@$~raw.A_grandparentInstance@@");
    expect(tryObjectTransient(harness.getValker(), parentInGrandparentInstanceId, "TestThing"))
        .toBeFalsy();
  });

  it("creates level 2 ghosts properly even after level 1 ghosts have been materialized", () => {
    const harness = createRAEMTestHarness({ verbosity: 0 }, createBlockA,
        createGrandparentInstance);
    const parentInInstance = harness.run(vRef("A_grandparentInstance"),
        ["§->", "children", 0]);
    harness.proclaimTestEvent(fieldsSet({ id: parentInInstance, typeName: "TestThing", sets: {
      name: "parentInInstance",
    }, }));
    expect(harness.run(parentInInstance, "name"))
        .toEqual("parentInInstance");
    harness.proclaimTestEvent(createGrandparentInstanceInstance[0]);
    const parentInInstanceInstance = harness.run(vRef("A_grandparentInstanceInstance"),
        ["§->", "children", 0], { verbosity: 0 });
    expect(parentInInstanceInstance)
        .not.toEqual(parentInInstance);
    expect(harness.run(parentInInstanceInstance, "name"))
        .toEqual("parentInInstance");
  });

  describe("Self-recursive instances", () => {
    const createGrandparentSelfRecursiveInstance = [
      created({ id: vRef("A_grandparentRecursor"), typeName: "TestThing", initialState: {
        instancePrototype: vRef("A_grandparent"),
        owner: vRef("A_grandparent"),
        name: "Self-recursed GP",
      }, }),
    ];
    it("calculates the owner of deep self-recursed instances correctly", () => {
      const harness = createRAEMTestHarness({ verbosity: 0 }, createBlockA,
          createGrandparentSelfRecursiveInstance);
      const recursor = harness.run(vRef("A_grandparentRecursor"), "id");
      const firstOrderRecursor = harness.run(recursor, ["§->", "unnamedOwnlings", 0]);
      expect(firstOrderRecursor).not.toEqual(recursor);
      expect(harness.run(firstOrderRecursor, "name")).toEqual("Self-recursed GP");
      expect(harness.run(firstOrderRecursor, "owner")).toEqual(recursor);

      const secondOrderRecursor = harness.run(firstOrderRecursor, ["§->", "unnamedOwnlings", 0]);
      expect(secondOrderRecursor).not.toEqual(recursor);
      expect(secondOrderRecursor).not.toEqual(firstOrderRecursor);
      expect(harness.run(secondOrderRecursor, "name")).toEqual("Self-recursed GP");
      expect(harness.run(secondOrderRecursor, "owner")).toEqual(firstOrderRecursor);

      const thirdOrderRecursor = harness.run(secondOrderRecursor, ["§->", "unnamedOwnlings", 0]);
      expect(thirdOrderRecursor).not.toEqual(recursor);
      expect(thirdOrderRecursor).not.toEqual(firstOrderRecursor);
      expect(thirdOrderRecursor).not.toEqual(secondOrderRecursor);
      expect(harness.run(thirdOrderRecursor, "name")).toEqual("Self-recursed GP");
      expect(harness.run(thirdOrderRecursor, "owner")).toEqual(secondOrderRecursor);
    });
  });
});
