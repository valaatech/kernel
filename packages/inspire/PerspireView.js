// @flow
import "@babel/polyfill";
import VDOMView from "~/inspire/VDOMView";

/**
 * This class is the view entry point
 */
export default class PerspireView extends VDOMView {
  async attach (options : Object) {
    await super.attach(options);
    try {
      // Renderer
      global.window = options.window; // makes sure that React will use correct window
      await this._createReactRoot(options.rootId, options.window, options.container,
          this._vViewFocus, options.name);
      await this._waitForConnectionsToActivate();
      this.warnEvent(`attach(): engine running, view attached to DOM and all initial UI partition${
          ""} connections complete`);
      return this;
    } catch (error) {
      throw this.wrapErrorEvent(error,
          `attach('${options.name}' -> ${options.lensURI || options.rootLensURI})`);
    }
  }

  async _waitForConnectionsToActivate () {
    let pendingConnections;
    while (true) {
      pendingConnections = this._vViewFocus.engine.getProphet().getActivatingConnections();
      const keys = Object.keys(pendingConnections);
      if (!keys.length) break;
      this.warnEvent(`attach(): acquiring pending UI-initiated connections:`, ...keys);
      await Promise.all(Object.values(pendingConnections));
    }
    this.warnEvent(`attach(): all connections acquired:`,
        ...Object.values(this._vViewFocus.engine.getProphet().getActiveConnections())
            .map(connection => `\n\t${connection.debugId()}`));
  }
}
