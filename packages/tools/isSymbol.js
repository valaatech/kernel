Object.defineProperty(exports, "__esModule", { value: true });

exports.default = function isSymbol (value) {
  return (typeof value === "symbol")
      || ((typeof value === "object") && value && value.constructor
          && (value.constructor.name === "Symbol"));
};
