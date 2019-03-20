(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./global-entities"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const global_entities_1 = require("./global-entities");
    function loadNodes(node, path, valuableNodes, exportedOnly) {
        node.path = path;
        if (path[0]) {
            path[0].idMap = path[0].idMap || {};
            path[0].idMap[node.id] = node;
        }
        if (global_entities_1.isGlobalNode(node, exportedOnly)) {
            valuableNodes.push(node);
        }
        if (node.children) {
            for (let childNode of node.children) {
                loadNodes(childNode, [...path, node], valuableNodes, exportedOnly);
            }
        }
        if (node.signatures) {
            for (let childNode of node.signatures) {
                loadNodes(childNode, [...path, node], valuableNodes, exportedOnly);
            }
        }
        if (node.parameters) {
            for (let childNode of node.parameters) {
                loadNodes(childNode, [...path, node], valuableNodes, exportedOnly);
            }
        }
    }
    exports.loadNodes = loadNodes;
});
//# sourceMappingURL=load-nodes.js.map