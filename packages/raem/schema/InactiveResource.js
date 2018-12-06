// @flow
import { GraphQLObjectType } from "graphql/type";

import TransientFields, { transientFields } from "~/raem/schema/TransientFields";

const OBJECT_DESCRIPTION = "inactive resource";

export default new GraphQLObjectType({
  name: "InactiveResource",

  description: `An InactiveResource is a Resource whose partition has not yet been fully loaded, ${
      ""} and has only the limited set of fields of TransientFields available. The transition from ${
      ""} InactiveResource to and from other concrete Resource types is the only possible runtime ${
      ""} type change, and happens dynamically based on the partition activation and inactivation.`,

  interfaces: () => [TransientFields],

  fields: () => ({
    ...transientFields(OBJECT_DESCRIPTION).fields(),
  }),
});
