exports.command = ".status/10-authollery";
exports.summary = "displays the generic information header for the current repository";
exports.describe = `${exports.summary}`;

exports.builder = (yargs) => yargs;

exports.handler = (yargv) => {
  const authollery = yargv.vlm.valmaConfig && yargv.vlm.valmaConfig.authollery;
  if (autholleryConfig) {
    console.log(`authollery stack: ${autholleryConfig.stack}`);
  } else {
    console.error(`valma-status: valma config authollery section not found (run 'vlm configure')`);
  }
};
