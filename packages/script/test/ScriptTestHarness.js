// @flow

import { tryHostRef } from "~/raem/VALK/hostReference";
import RAEMTestHarness, { createRAEMTestHarness } from "~/raem/test/RAEMTestHarness";

import ScriptTestAPI from "~/script/test/ScriptTestAPI";
import { Kuery, valoscriptSteppers } from "~/script/VALSK";
import { transpileValoscriptBody } from "~/script/transpileValoscript";

export function createScriptTestHarness (options: Object, ...commandBlocks: any) {
  return createRAEMTestHarness({
    name: "Script Test Harness", ContentAPI: ScriptTestAPI, TestHarness: ScriptTestHarness,
    corpus: { steppers: valoscriptSteppers },
    ...options,
  }, ...commandBlocks);
}

export default class ScriptTestHarness extends RAEMTestHarness {
  runValoscript (self: any, valoscriptBody: string, options: Object = {}) {
    const bodyKuery = transpileValoscriptBody(valoscriptBody, {
      verbosity: options.verbosity || 0,
      customVALK: this.ContentAPI.VALK,
      sourceInfo: options.sourceInfo,
    });
    options.discourse = this.valker.acquireTransaction("test-run-body");
    const selfMaybeRef = tryHostRef(self) || self;
    (options.scope || (options.scope = {})).this = selfMaybeRef;
    const ret = this.run(selfMaybeRef, bodyKuery, options);
    if (options.discourse) {
      const result = options.discourse.releaseTransaction();
      if (result) {
        return Promise.resolve((options.awaitResult || (r => r.getPersistedEvent()))(result))
            .then(() => ret);
      }
    }
    return ret;
  }
}

/**
 * Calls given expressionKuery against given corpus, setting given thisReference as the call this
 * and given scope as the lexical scope of the call.
 *
 * @param {any}    corpus
 * @param {Kuery}  programKuery
 * @param {VRL}   thisReference
 * @param {Object} scope
 * @returns                       the resulting value of the expressionKuery
 */
export function evaluateTestProgram (commandBlocks: any = [],
    head: any, programKuery: Kuery, scope: ?Object, options: Object = {}) {
  const harness = createScriptTestHarness({ verbosity: options.verbosity }, ...commandBlocks);
  if (options.harness) Object.setPrototypeOf(options.harness, harness);
  if (scope) {
    options.scope = scope;
    scope.this = head;
  }
  return harness.run(head, programKuery, options);
}
