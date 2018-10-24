// @flow

import { AuthorityProphet } from "~/prophet";

export default function createValaaTransientScheme (/* { logger } */) {
  return {
    scheme: "valaa-transient",

    getAuthorityURIFromPartitionURI: () => `valaa-transient:`,

    createDefaultAuthorityConfig: (/* partitionURI: ValaaURI */) => ({
      isLocallyPersisted: false,
      isPrimaryAuthority: true,
      isRemoteAuthority: false,
    }),

    createAuthorityProphet: (options: Object) => new AuthorityProphet(options),
  };
}
