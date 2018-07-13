(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./node-operations", "./compare-signatures"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const node_operations_1 = require("./node-operations");
    const compare_signatures_1 = require("./compare-signatures");
    function checkCompability(oldNode, newNode, log) {
        log.verbose(log.nodeWithPathToString(oldNode, true));
        if (oldNode.children) {
            let number = 0;
            let lastPercent = 0;
            for (let oldChildNode of oldNode.children) {
                oldChildNode.path = oldNode.path && [...oldNode.path, oldNode] || oldChildNode.path;
                let newChildNode = newNode.children && newNode.children.find(x => x.name == oldChildNode.name && node_operations_1.pathsEqual(x.path, oldChildNode.path));
                if (!newChildNode && newNode.kindString == "Type alias") {
                    let refName = newNode.type.name;
                    let refNode = node_operations_1.findNodeByNameRec(newNode.path[0], refName);
                    newChildNode = refNode && refNode.children && refNode.children.find(x => x.name == oldChildNode.name);
                }
                if (!newChildNode) {
                    log.nodeNotFound(oldChildNode);
                }
                else {
                    compare_signatures_1.checkSignaturesCompatible(oldChildNode, newChildNode, log);
                    checkCompability(oldChildNode, newChildNode, log);
                }
                number++;
                if (!oldNode.path) {
                    let percent = Math.round((number / oldNode.children.length) * 100);
                    if (percent - lastPercent >= 10) {
                        console.info(percent + "% complete");
                        lastPercent = percent;
                    }
                }
            }
        }
    }
    exports.checkCompability = checkCompability;
});
//# sourceMappingURL=check-compability.js.map