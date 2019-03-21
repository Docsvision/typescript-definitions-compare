(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.globalEntities = ["Class", "Interface", "Variable", "Function", "Type alias"];
    function isGlobalNode(node, exportedOnly) {
        return node && exports.globalEntities.indexOf(node.kindString) >= 0 && (!exportedOnly ||
            (node.flags.isExported || (node.path && node.path.length > 0 && node.path[node.path.length - 1].flags.isExported)));
    }
    exports.isGlobalNode = isGlobalNode;
});
//# sourceMappingURL=global-entities.js.map