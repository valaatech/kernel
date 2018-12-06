// @flow
import { GraphQLObjectType } from "graphql/type";

import primaryField from "~/raem/tools/graphql/primaryField";

import Describable, { describableInterface } from "~/raem/schema/Describable";
import Discoverable from "~/raem/schema/Discoverable";
import TransientFields from "~/raem/schema/TransientFields";
import Resource from "~/raem/schema/Resource";

import Expression from "~/script/schema/Expression";

const OBJECT_DESCRIPTION = "property";

export default new GraphQLObjectType({
  name: "Property",

  description: "A string name to expression property",

  interfaces: () => [Describable, Discoverable, Resource, TransientFields],

  fields: () => ({
    ...describableInterface(OBJECT_DESCRIPTION).fields(),

    ...primaryField("value", Expression,
        "The target of the property",
        { initialValue: null, defaultValue: undefined },
    ),
  }),
});
