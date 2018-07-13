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
    function pathsEqual(path1, path2) {
        if (!path1 && path2 || !path2 && path1)
            return false;
        if (path1.length != path2.length)
            return false;
        // Skip first root service item
        for (let i = 1; i < path1.length; i++) {
            if (path1[i].name != path2[i].name) {
                return false;
            }
        }
        return true;
    }
    exports.pathsEqual = pathsEqual;
    function findNodeByNameRec(current, nodeName) {
        if (current && current.name == nodeName) {
            return current;
        }
        else if (current && current.children) {
            for (let child of current.children) {
                let found = findNodeByNameRec(child, nodeName);
                if (found)
                    return found;
            }
        }
    }
    exports.findNodeByNameRec = findNodeByNameRec;
    function findNodeByIdRec(current, nodeId) {
        return (current.path[0] || current).idMap[nodeId];
    }
    exports.findNodeByIdRec = findNodeByIdRec;
    function resolveTypeAlias(rootNode, typeId) {
        let typeNode = findNodeByIdRec(rootNode, typeId);
        if (typeNode && typeNode.kindString == "Type alias") {
            typeNode = findNodeByIdRec(rootNode, typeNode.type.id);
        }
        return typeNode;
    }
    exports.resolveTypeAlias = resolveTypeAlias;
});
//# sourceMappingURL=node-operations.js.map