exports.command = ".configure/.type/module";
exports.summary = "Configure a Valma module repository";
exports.describe = `${exports.summary}.
A valma module is a package which provides tools and their supporting
configurations for valma repositories. These tools might be new valma
commands, external dependendies, plain javascript libraries; anything
that can go into a package really.
The defining quality of modules is that they are visible to
valma-configure, can be selectively enabled and disabled and can have
a configuration section inside valma.json.

A valma modules are added as regular (dev)dependency and configured
by running 'vlm configure' afterwards.
`;

exports.disabled = (yargs) => !(yargs.vlm.packageConfig || {}).valaa;
exports.builder = (yargs) => yargs.options({
  "repository-type": {
    type: "string",
    description: `Limit this module to repositories with this valaa type (empty "" for no limit).`,
    default: yargs.vlm.packageConfig.valaa.domain,
    interactive: { type: "input", when: true ? "always" : "if-undefined" },
  },
});

exports.handler = async (yargv) => {
  const vlm = yargv.vlm;
  const repositoryTypeGlob = yargv.repositoryType ? `.type/.${yargv.repositoryType}/` : "";
  await vlm.askToCreateValmaScriptSkeleton(
      `.valma-configure/${repositoryTypeGlob}${vlm.packageConfig.name}`,
      "valma-configure_module.js",
      "module configure",
`Configure the module ${vlm.packageConfig.name} for the current repository`,
      repositoryTypeGlob
          ? `This script is called when a repository with valaa type equal to
'${yargv.repositoryType}' is configured.`
          : `This script is called when any repository is configured.`,
  );

  return yargv.vlm.callValma(`.configure/.type/.module/**/*`);
};