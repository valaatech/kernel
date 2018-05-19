// @flow

export default function createValaaTestScheme (/* { logger } */) {
  return {
    scheme: "valaa-test",

    getAuthorityURIFromPartitionURI: () => `valaa-test:`,

    createDefaultAuthorityConfig: (/* partitionURI: URL */) => ({}),

    createAuthorityProphet: () => null,
  };
}