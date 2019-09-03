exports.command = ".configure/.type/workshop";
exports.describe = "Initialize workshop workspace";
exports.introduction =
`A workshop package provides a set of valma commands for defining and
managing a ValOS domain. The workshops then:
1. shall provide domain package (de)registration via
   .configure/.<domain>/{,de}register-package
2. can provide new workspace types via .configure/.type/*
3. can provide new toolsets via
   .configure/{,.type/.<type>/,.domain/.<domain>/}.toolset/**/*

Notably the package (de)registration should provide means for any new
domain toolset packages to request the addition of their toolset
configure command to the domain workshop.
Idiomatic way to implement this is a workshop command which issues a PR
against the source control repository of the workshop package.`;

exports.disabled = (yargs) => (yargs.vlm.getValOSConfig("type") !== "workshop")
    && `Workspace is not a 'workshop' (is '${yargs.vlm.getValOSConfig("type")}')`;
exports.builder = (yargs) => yargs.options({
  reconfigure: {
    alias: "r", type: "boolean",
    description: "Reconfigure all 'workshop' configurations of this workspace.",
  },
});

exports.handler = () => ({
  devDependencies: { "@valos/type-workshop": true },
  toolsetsUpdate: { "@valos/type-workshop": { inUse: "always" } },
  success: true,
});