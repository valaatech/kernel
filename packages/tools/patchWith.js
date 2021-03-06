Object.defineProperty(exports, "__esModule", { value: true });

const { dumpObject, wrapError } = require("./wrapError");

/**
 * Recursively updates the *target* with the changes described in *patch*
 * using customized rules and callbacks of *options*: {
 *   spreaderKey: string = "...",
 *   preExtend: (tgt, patch, key, tgtObj, patchObj) => any,
 *   spread (spreader, tgt, patch, key, tgtObj, patchObj) => any,
 *   postExtend: (tgt, patch, key, tgtObj, patchObj) => any,
 *   keyPath: string[] = [],
 *   concatArrays: boolean = true,
 *   patchSymbols: boolean = false,
 *   complexPatch: ?("overwrite", "patch", "setOnInitialize", "reject") = "reject",
 * }
 * If *pre|postExtend* returns non-undefined then that value is directly
 * returned skipping the rest of that patch recursion branch,
 * otherwise patch is performed normally.
 * If *spread* returns **undefined** then undefined is returned and the
 * rest of that patch recursion is skipped. Otherwise the return value
 * is patched on target and its result is returned.
 *
 * Any nested patch object with the key "..." is treated as a link to
 * an external resource and is spread before extension.
 *
 * patchWith semantics are defined by callbacks:
 * - options.preExtend can be used to fully replace an extend
 *   operation at some nesting level with the final result value (with
 *   semantics identical to lodash.mergeWith customizer)
 * - options.spreader resolves link location, retrieves the resource
 *   and interprets the resource as a native object
 * - options.postExtend is called after preExtend/extend steps to
 *   finalize the extend at some depth (identical parameters with
 *   preExtend)
 *
 * The default options.spread semantics is to call options.require for
 * the link location.
 * The default options.extend semantics is to treat link parameters as
 * spread patch property data overrides.
 *
 * Additionally patchWith introduces the *spread operation* and the *spreader properties*.
 * As first class properties (default key "...") these spreader properties can be used to /describe/
 * localized, lazily evaluated, and context-dependent deep extend operations as persistent,
 * fully JSON-compatible data.
 *
 * The idiomatic example is shared JSON configurations (similar to babel presets or eslint extends):
 *
 * Given two JSON files:
 * // common.json
 * `{ kind: "project", name: "unnamed", plugins: ["basicplugin"] }`
 * // myproject.json
 * `{ "...": "./common.json", name: "myproject", plugins: ["myplugin"] }`
 *
 * When myproject.json is deep-extended onto {} (with the contextual configSpread callback)
 * `patchWith({}, myProjectJSON, { spread: configSpread });`
 * the result equals `{ kind: "project", name: "myproject", plugins: ["basicplugin", "myplugin"] }`.
 *
 * The configSpread callback interprets the "./common.json" spreader value as a file read operation.
 * patchWith then appends the result of that onto {} followed by the rest of myProjectJSON.
 *
 *
 * Deep extend has two semantics: the universal deep extend semantics and the spread semantics.
 *
 * Deep extend semantics depend only on the patch value type:
 * Empty object and undefined patch values are no-ops and return the target unchanged.
 * Arrays in-place append and plain old objects in-place update the target value and return the
 * mutated target value. All other patch values are returned directly.
 * If target of an in-place operation is not of an appropriate type a new empty object or array is
 * created as the target and returned after sub-operations.
 * Update performs a sub-deep-assign for each enumerable key of the patch object. If the return
 * value is not undefined and differs from the corresponding value on the target it is assigned to
 * the target.
 *
 * Examples of deep append:
 *
 * patchWith({ foo: [1], bar: "a" }, { foo: [2], bar: "b" })          -> { foo: [1, 2], bar: "b" }
 * patchWith({ foo: [1] }, [{ foo: [2, 3] }, { foo: { 1: 4 } }])      -> { foo: [1, 4, 3] }
 * patchWith({ foo: [1] }, { foo: null })                             -> { foo: null }
 * patchWith({ foo: [1] }, [{ foo: null }, { foo: [3] }])             -> { foo: [3] }
 *
 * If a patch object of some nested deep append phase has a spreader property (by default "...")
 * then right before it is deep assigned a spread operation is performed:
 * 1. The spread callback is called like so:
 *    const intermediate = spread(patch["..."], target, patch, key, targetParent,
 *    patchParent).
 * 2. If the returned intermediate is undefined the subsequent deep assign of the patch is skipped
 *    and deep assign returns targetParent[key].
 * 3. Otherwise the intermediate is deep assigned onto the target value, potentially recursively
 *    evaluating further spread operations.
 * 4. Finally the original patch object is omitted the spreader property and deep assigned onto
 *    the target value (which has now potentially been much mutated).
 *
 * patchWith([1, 2, 3], { 1: null })                                  -> [1, null, 3]
 * patchWith([1, 2, 3], { 1: undefined })                             -> [1, undefined, 3]
 * patchWith([1, 2, 3], { 1: { "...": null } })                       -> [1, 3]
 *
 *
 * Examples of spreaders:
 *
 * const fooRewriter = { "...": [{ foo: null }, { foo: [3] }] }
 * patchWith({de:{ep:{ foo: [1] }}}, {de:{ep: fooRewriter }})         -> {de:{ep:{ foo: [3] }}}
 *
 * const arrayRewriter = { "...": [null, [3]] }
 * patchWith({de:{ep:{ foo: [1] }}}, {de:{ep:{ foo: arrayRewriter }}})-> {de:{ep:{ foo: [3] }}}
 *
 *
 * Elementary extend rules as "target ... patch -> result" productions based on patch type:
 *
 * patch: undefined | {}          -> target
 * patch: { "...": spr, ...rest } -> patchWith(patchWith(target, spread(spr, ...)), rest)
 * patch: Array                   -> asArray(target, (ret =>
 *                                     patch.forEach(e => ret.push(patchWith(null, [e])))))
 * patch: Object                  -> asObject(target, (ret => Object.keys(patch).forEach(key =>
 *                                     { ret[key] = patchWith(ret[key], [patch[key]]); });
 * patch: any                     -> patch
 *
 * @export
 * @param {*} target
 * @param {*} spreadee
 * @param {*} stack
 */
exports.default = function patchWith (target /* : Object */, patch /* : Array<any> */,
    options /* : {
  spread?: Function,
  spreaderKey?: string,
  preExtend?: Function,
  postExtend?: Function,
  keyPath?: Array<any>,
} */) {
  const stack = options || {};
  stack.returnUndefined = _returnUndefined;
  if (stack.concatArrays === undefined) stack.concatArrays = true;
  if (stack.customizer) {
    stack.preExtend = stack.customizer;
    console.warn("patchWith.options.customizer DEPRECATED in favor of options.preExtend");
  }
  if (stack.postProcessor) {
    stack.postExtend = stack.postProcessor;
    console.warn("patchWith.options.postProcessor DEPRECATED in favor of options.postExtend");
  }
  stack.extend = extend;
  if (stack.spreaderKey === undefined) stack.spreaderKey = "...";
  if (stack.spreaderKey && !stack.spread) {
    stack.spread = function spread (spreadee_, target_, patch_, keyInParent,
        targetParent /* , patchParent */) {
      if ((spreadee_ === null) || (spreadee_ === undefined)) return undefined;
      if (typeof spreadee_ === "function") {
        return (targetParent[keyInParent] = spreadee_(target_));
      }
      if (typeof spreadee_ === "string") {
        if (!this.require) {
          throw new Error(`No patchWith.options.require specified (needed by default spread ${
              ""} for spreadee '${spreadee_}')`);
        }
        return this.require(spreadee_);
      }
      if (!Array.isArray(spreadee_)) return spreadee_;
      let ret = target_;
      for (const entry of spreadee_) {
        ret = this.extend(ret, entry);
      }
      targetParent[keyInParent] = ret;
      return undefined;
    };
  }
  return stack.extend(target, patch);
};

const _returnUndefined = Symbol("returnUndefined");

/* eslint-disable complexity */

function extend (target_, patch_, keyInParent, targetParent, patchParent, skipSpread = false) {
  let ret, phase = ".preExtend";
  try {
    if (this.keyPath && (keyInParent !== undefined)) this.keyPath.push(keyInParent);
    ret = this.preExtend
        && this.preExtend(target_, patch_, keyInParent, targetParent, patchParent);
    if (ret === undefined) {
      ret = target_;
      if (typeof patch_ !== "object") ret = (patch_ === undefined ? target_ : patch_);
      else if (patch_ === null) ret = null;
      else if (patch_ === target_) throw new Error("Cannot extend to self");
      else if (Array.isArray(patch_)) {
        phase = ".array";
        const isSpreader = !skipSpread && (patch_[0] === this.spreaderKey) && this.spreaderKey;
        if (isSpreader /* || ((ret !== undefined) && !Array.isArray(ret)) */) {
          // FIXME(iridian, 2019-11): this path should not be taken when this.concatArrays is false
          // even if ret is not an array. Fix was not straightforward.
          for (let i = 1; i !== patch_.length; ++i) {
            ret = this.extend(ret, patch_[i], keyInParent);
          }
        } else if (Array.isArray(ret) || !_setRetFromCacheAndMaybeBail(this)) {
          if (!this.concatArrays) ret = [];
          for (const entry of patch_) {
            const newEntry = this.extend(undefined, entry, ret.length, ret, patch_);
            if (newEntry !== undefined) ret.push(newEntry);
          }
        }
      } else if ((Object.getPrototypeOf(patch_) || Object.prototype) !== Object.prototype) {
        phase = ".complex";
        switch (this.complexPatch) {
          case "overwrite": return patch_;
          case "patch": return undefined;
          case "setOnInitialize":
            if (ret === undefined) return patch_;
            throw new Error("Invalid complex patch with setOnInitialize: target is not undefined");
          default:
            throw new Error(`Invalid complex patch (prototype not equal to Object.prototype): ${
                ""}see options.complexPatch`);
        }
      } else if (!skipSpread && this.spreaderKey
          && patch_[this.spreaderKey] && patch_.hasOwnProperty(this.spreaderKey)) {
        phase = ".spread";
        if (!_setRetFromSpreadAndMaybeBail(this, patch_[this.spreaderKey])
            && Object.keys(patch_).length > 1) {
          const src = !this.preExtend ? patch_ : { ...patch_ };
          if (this.preExtend) delete src[this.spreaderKey];
          ret = this.extend(ret, src, keyInParent, targetParent, patchParent, true);
        }
      } else {
        phase = ".object";
        const targetIsArray = Array.isArray(ret);
        const keys = Object.keys(patch_);
        if (this.patchSymbols) {
          keys.push(...Object.getOwnPropertySymbols(patch_));
        }
        for (const key of keys) {
          if (key === this.spreaderKey) continue;
          if (((ret === null) || (typeof ret !== "object")) && _setRetFromCacheAndMaybeBail(this)) {
            break;
          }
          const newValue = this.extend(ret[key], patch_[key], key, ret, patch_);
          if (newValue !== undefined) ret[key] = newValue;
          else if (!targetIsArray) delete ret[key];
        }
        if (targetIsArray) {
          for (let i = 0; i !== ret.length; ++i) if (ret[i] === undefined) ret.splice(i--, 1);
        } else if (ret === undefined) {
          _setRetFromCacheAndMaybeBail(this);
        }
      }
    }
    if (this.postExtend) {
      phase = ".postExtend";
      ret = this.postExtend(ret, patch_, keyInParent, targetParent, patchParent, this);
    }
    return ret === _returnUndefined ? undefined : ret;
  } catch (error) {
    throw wrapError(error,
        new Error(`patchWith.extend(keyPath: ${(this.keyPath || []).join(" | ")})${phase}`),
        "\n\tkeyInParent:", ...dumpObject(keyInParent),
        "\n\ttarget_:", ...dumpObject(target_),
        "\n\tpatch_:", ...dumpObject(patch_),
    );
  } finally {
    if (this.keyPath && (keyInParent !== undefined)) this.keyPath.pop();
  }

  function _setRetFromSpreadAndMaybeBail (stack, spreaderValue) {
    const spreadee = stack.spread(
        spreaderValue, ret, patch_, keyInParent, targetParent, patchParent, stack);
    if (spreadee === undefined) {
      // spread callback has handled the whole remaining process and
      // has possibly replaced 'target' in its targetParent[keyInParent]
      // update ret to refer to this new object accordingly.
      ret = targetParent && targetParent[keyInParent];
      return true;
    }
    ret = stack.extend(ret, spreadee, keyInParent, targetParent, patchParent);
    return false;
  }

  // Returns true on cache hit for synchronous return: patch has already extended the target
  function _setRetFromCacheAndMaybeBail (stack) {
    const cache = stack.cache || (stack.cache = new Map());
    const cacheHit = cache.get(patch_);
    if (cacheHit) {
      ret = cacheHit;
      return true;
    }
    cache.set(patch_, (ret = (Array.isArray(patch_) ? [] : {})));
    return false;
  }
}
