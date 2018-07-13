(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./global-entities", "path", "fs", "minimatch"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const global_entities_1 = require("./global-entities");
    const path = require("path");
    const fs = require("fs");
    const minimatch = require("minimatch");
    var ErrorType;
    (function (ErrorType) {
        ErrorType[ErrorType["NodeNotFound"] = 404] = "NodeNotFound";
        ErrorType[ErrorType["AddedNotOptionalParam"] = 300] = "AddedNotOptionalParam";
        ErrorType[ErrorType["ChangedParamType"] = 301] = "ChangedParamType";
        ErrorType[ErrorType["ChangedReturnType"] = 302] = "ChangedReturnType";
    })(ErrorType = exports.ErrorType || (exports.ErrorType = {}));
    class AppLogger {
        constructor(options) {
            this.options = options;
            this.sourceFiles = null;
            this.lastGlobalNode = null;
            this.ident = '    ';
            this.issuesCount = 0;
        }
        get countOfIssues() {
            return this.issuesCount;
        }
        nodeNotFound(node) {
            const errorType = ErrorType.NodeNotFound;
            this.printGrouped(node, ErrorType.NodeNotFound, (nodeStr, isGlobal) => {
                return this.getFlatNodeError(errorType, nodeStr);
            }, (nodeStr, isGlobal) => {
                if (isGlobal) {
                    return this.getNodeErrorRow(errorType, nodeStr) + ' (' + node.kindString.toLowerCase() + ')';
                }
                else {
                    let inheritedStr = node.inheritedFrom && (', inherited from ' + node.inheritedFrom.name) || '';
                    let protectedStr = node.flags && node.flags.isProtected ? 'protected ' : '';
                    return this.ident + this.getNodeErrorRow(errorType, nodeStr) + ' ' +
                        '(' + protectedStr + node.kindString.toLowerCase() + inheritedStr + ')';
                }
            });
        }
        addedNotOptionalParam(paramNode) {
            const errorType = ErrorType.AddedNotOptionalParam;
            let node = paramNode;
            this.printGrouped(node, errorType, (nodeStr, isGlobal) => {
                return this.getFlatNodeError(errorType, nodeStr);
            }, (nodeStr, isGlobal) => {
                return this.ident + this.getNodeErrorRow(errorType, nodeStr) + ' (added not optional parameter)';
            });
        }
        changedParamType(paramNode, oldType, newType, incopablity) {
            const errorType = ErrorType.ChangedParamType;
            let node = paramNode;
            this.printGrouped(node, errorType, (nodeStr, isGlobal) => {
                let data = this.getFlatNodeError(errorType, nodeStr);
                data.oldType = this.nodeWithPathToString(oldType, true);
                data.newType = this.nodeWithPathToString(newType, true);
                data.incopablity = this.nodeWithPathToString(incopablity, true);
                return data;
            }, (nodeStr, isGlobal) => {
                let ident = (isGlobal) ? '' : this.ident;
                let lineIdent = this.ident;
                let newLine = '\r\n';
                return ident + this.getNodeErrorRow(errorType, nodeStr) + ' changed param type' + newLine +
                    ident + lineIdent + ' oldType: ' + newLine +
                    ident + lineIdent + ' newType: ' + this.nodeWithPathToString(newType, true) + newLine +
                    ident + lineIdent + ' incopability: ' + this.nodeWithPathToString(incopablity, true);
            });
        }
        changedReturnType(paramNode, oldType, newType, incopablity) {
            const errorType = ErrorType.ChangedReturnType;
            let node = paramNode;
            this.printGrouped(node, errorType, (nodeStr, isGlobal) => {
                let data = this.getFlatNodeError(errorType, nodeStr);
                data.oldType = this.nodeWithPathToString(oldType, true);
                data.newType = this.nodeWithPathToString(newType, true);
                data.incopablity = this.nodeWithPathToString(incopablity, true);
                return data;
            }, (nodeStr, isGlobal) => {
                let ident = (isGlobal) ? '' : this.ident;
                let lineIdent = this.ident;
                let newLine = '\r\n';
                return ident + this.getNodeErrorRow(errorType, nodeStr) + ' changed return type' + newLine +
                    ident + lineIdent + ' oldType: ' + this.nodeWithPathToString(oldType, false) + newLine +
                    ident + lineIdent + ' newType: ' + this.nodeWithPathToString(newType, false) + newLine +
                    ident + lineIdent + ' incopability: ' + this.nodeWithPathToString(incopablity, false);
            });
        }
        log(msg) {
            if (this.options.outFile) {
                fs.appendFileSync(this.options.outFile, msg + '\r\n');
            }
            else {
                console.log(msg);
            }
        }
        logFlat(msg) {
            this.issuesCount++;
            if (this.options.flatOutFile) {
                fs.appendFileSync(this.options.flatOutFile, JSON.stringify(msg) + '\r\n');
            }
            else {
                this.log(JSON.stringify(msg));
            }
        }
        verbose(msg) {
            if (this.options.verboseOut) {
                this.log(msg);
            }
        }
        printGrouped(node, errorType, printFlat, print) {
            let globalNode = this.getGlobalNode(node);
            let isGlobal = globalNode == node;
            let nodeStrFlat = this.nodeWithPathToString(node, true);
            let flatData = printFlat(nodeStrFlat, isGlobal);
            let rule = this.isIgnored(flatData);
            if (!rule) {
                if (!isGlobal && globalNode != this.lastGlobalNode) {
                    let sourceFile = this.options.mapToSourceDir && this.tryFindNodeSourceFile(globalNode, globalNode);
                    let sourceFileLog = sourceFile ? ' ' + sourceFile : '';
                    this.log(this.nodeWithPathToString(globalNode, false) + sourceFileLog);
                    this.lastGlobalNode = globalNode;
                }
                let out = print(this.nodeWithPathToString(node, false), isGlobal);
                this.log(out);
                this.logFlat(flatData);
            }
            else {
                this.verbose('Ignored ' + JSON.stringify(flatData) + ' by rule ' + JSON.stringify(rule));
            }
        }
        getErrorString(errorType) {
            return errorType.toString();
        }
        getNodeErrorRow(errorType, nodeStr) {
            return '[' + this.getErrorString(errorType) + '] ' + nodeStr;
        }
        getFlatNodeError(errorType, nodeStr) {
            return { code: this.getErrorString(errorType), node: nodeStr };
        }
        nodeWithPathToString(node, flat) {
            const ignoreKinds = ["Call signature", "Constructor signature"];
            let dp = flat ? '/' : '.';
            let path = node.path &&
                node.path.filter(x => x.name && ignoreKinds.indexOf(x.kindString) < 0)
                    .map(x => x.name)
                    .join(dp) || '';
            if (ignoreKinds.indexOf(node.kindString) < 0) {
                let split = path.length > 0 ? dp : '';
                return path + split + node.name;
            }
            else {
                return path;
            }
        }
        getGlobalNode(node) {
            let globalNode = node;
            let pathIndex = node.path && (node.path.length - 1) || 0;
            while (pathIndex >= 0 && !global_entities_1.isGlobalNode(globalNode)) {
                globalNode = node.path[pathIndex];
                pathIndex--;
            }
            return globalNode;
        }
        tryFindNodeSourceFile(node, globalNode) {
            var findFilesRec = function (dir, result) {
                let files = fs.readdirSync(dir);
                for (let file of files) {
                    let filePath = dir + '/' + file;
                    if (fs.statSync(filePath).isDirectory()) {
                        let found = findFilesRec(filePath, result);
                        if (found) {
                            return found;
                        }
                    }
                    else {
                        let fileExension = path.extname(file);
                        if (fileExension == '.ts' || fileExension == '.tsx') {
                            result.push({ path: filePath, content: fs.readFileSync(filePath, 'utf8') });
                        }
                    }
                }
            };
            if (!this.sourceFiles) {
                this.sourceFiles = [];
                findFilesRec(this.options.mapToSourceDir, this.sourceFiles);
            }
            for (let fileInfo of this.sourceFiles) {
                let regexp;
                if (globalNode.kindString == "Class") {
                    regexp = new RegExp(`class\\s*` + globalNode.name, "gm");
                }
                else if (globalNode.kindString == "Interface") {
                    regexp = new RegExp(`interface\\s*` + globalNode.name, "gm");
                }
                else if (globalNode.kindString == "Variable") {
                    regexp = new RegExp(`(var|const)\\s*` + globalNode.name, "gm");
                }
                else if (globalNode.kindString == "Function") {
                    regexp = new RegExp(`function\\s*` + globalNode.name, "gm");
                }
                if (regexp.test(fileInfo.content)) {
                    return fileInfo.path;
                }
            }
        }
        isIgnored(nodeError) {
            return this.options.ignoreRules.find((rule) => {
                let match = true;
                for (let prop in rule) {
                    if (Object.getOwnPropertyDescriptor(rule, prop) && prop != "comment") {
                        if (!nodeError[prop] || minimatch(nodeError[prop], rule[prop])) {
                            match = false;
                            break;
                        }
                    }
                }
                return match;
            });
        }
    }
    exports.AppLogger = AppLogger;
});
//# sourceMappingURL=app-logger.js.map