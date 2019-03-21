import { isGlobalNode } from "./global-entities";
import * as path from "path";
import * as fs from "fs";
import { DeclarationNode } from "./declaration-node";
import * as minimatch from "minimatch";

export interface AppLoggerOptions {
    mapToSourceDir: string;
    outFile: string;
    flatOutFile: string;
    verboseOut: boolean; 
    ignoreRules: object[];
}

export enum ErrorType {
    NodeNotFound = 404,
    AddedNotOptionalParam = 300,
    ChangedParamType = 301,
    ChangedReturnType = 302
}

export class AppLogger {
    private sourceFiles: { path: string, content: string } [] = null;
    private lastGlobalNode: DeclarationNode = null;
    private ident: string = '    ';
    private issuesCount = 0;

    constructor(private options: AppLoggerOptions) {
    }

    public get countOfIssues() {
        return this.issuesCount;
    }

    public nodeNotFound(node: DeclarationNode) {
        const errorType = ErrorType.NodeNotFound;
        this.printGrouped(node, ErrorType.NodeNotFound, 
            (nodeStr, isGlobal) => {
                return this.getFlatNodeError(errorType, nodeStr, node);
            },
            (nodeStr, isGlobal) => {
                if (isGlobal) {
                    return this.getNodeErrorRow(errorType, nodeStr) + ' (' + node.kindString.toLowerCase() + ')';
                } else {
                    let inheritedStr = node.inheritedFrom && (', inherited from ' + node.inheritedFrom.name) || '';
                    let protectedStr = node.flags && node.flags.isProtected ? 'protected ' : '';
                    return this.ident + this.getNodeErrorRow(errorType, nodeStr) + ' ' + 
                        '(' + protectedStr + node.kindString.toLowerCase() + inheritedStr + ')';
                }
        });
    }

    public addedNotOptionalParam(paramNode: DeclarationNode) {
        const errorType = ErrorType.AddedNotOptionalParam;
        let node = paramNode;
        this.printGrouped(node, errorType, (nodeStr, isGlobal) => {
                return this.getFlatNodeError(errorType, nodeStr, node);
            },
            (nodeStr, isGlobal) => {
                return this.ident + this.getNodeErrorRow(errorType, nodeStr) + ' (added not optional parameter)';
            }
        );
    }    

    public changedParamType(paramNode: DeclarationNode, oldType: DeclarationNode, newType: DeclarationNode, incopablity: DeclarationNode) {
        const errorType = ErrorType.ChangedParamType;
        let node = paramNode;
        this.printGrouped(node, errorType, (nodeStr, isGlobal) => {
                let data = this.getFlatNodeError(errorType, nodeStr, node) as any;
                data.oldType = this.nodeWithPathToString(oldType, true);
                data.newType = this.nodeWithPathToString(newType, true);
                data.incopablity = this.nodeWithPathToString(incopablity, true);
                return data;
            }, 
            (nodeStr, isGlobal) => {
                let ident = (isGlobal) ? '' : this.ident;
                let lineIdent = this.ident;
                let newLine = '\r\n';
                return ident + this.getNodeErrorRow(errorType, nodeStr) + ' changed param type' + newLine +
                    ident + lineIdent + ' oldType: ' + newLine +
                    ident + lineIdent + ' newType: ' + this.nodeWithPathToString(newType, true) + newLine +
                    ident + lineIdent + ' incopability: ' + this.nodeWithPathToString(incopablity, true);
        });
    }    

    public changedReturnType(paramNode: DeclarationNode, oldType: DeclarationNode, newType: DeclarationNode, incopablity: DeclarationNode) {
        const errorType = ErrorType.ChangedReturnType;
        let node = paramNode;
        this.printGrouped(node, errorType, (nodeStr, isGlobal) => {
                let data = this.getFlatNodeError(errorType, nodeStr, node) as any;
                data.oldType = this.nodeWithPathToString(oldType, true);
                data.newType = this.nodeWithPathToString(newType, true);
                data.incopablity = this.nodeWithPathToString(incopablity, true);
                return data;
            }, 
            (nodeStr, isGlobal) => {
                let ident = (isGlobal) ? '' : this.ident;
                let lineIdent = this.ident;
                let newLine = '\r\n';
                return ident + this.getNodeErrorRow(errorType, nodeStr) + ' changed return type' + newLine +
                    ident + lineIdent + ' oldType: ' + this.nodeWithPathToString(oldType, false) + newLine +
                    ident + lineIdent + ' newType: ' + this.nodeWithPathToString(newType, false) + newLine +
                    ident + lineIdent + ' incopability: ' + this.nodeWithPathToString(incopablity, false);            
            }
        );
    }    
    

    public log(msg: string) {
        if (this.options.outFile) {
            fs.appendFileSync(this.options.outFile, msg + '\r\n');
        } else {
            console.log(msg);
        }
    }
    public logFlat(msg: object) {
        this.issuesCount++;
        if (this.options.flatOutFile) {
            fs.appendFileSync(this.options.flatOutFile, JSON.stringify(msg) + '\r\n');
        } else {
            this.log(JSON.stringify(msg));
        }
    }

    public verbose(msg: string) {
        if (this.options.verboseOut) {
            this.log(msg);
        }
    }

    private printGrouped(
        node: DeclarationNode, 
        errorType: ErrorType,
        printFlat: (nodeStr: string, isGlobal: boolean) => object,
        print:  (nodeStr: string, isGlobal: boolean) => string)         
    {
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
        } else {
            this.verbose('Ignored ' + JSON.stringify(flatData) + ' by rule ' + JSON.stringify(rule));
        }
    }

    private getErrorString(errorType: ErrorType) {
        return (errorType as number).toString();
    }

    private getNodeErrorRow(errorType: ErrorType, nodeStr: string) {
            return '[' + this.getErrorString(errorType) + '] ' + nodeStr;
    }

    private getFlatNodeError(errorType: ErrorType, nodeStr: string, node: DeclarationNode) {
        let err = { code: this.getErrorString(errorType), node: nodeStr  } as any;
        if (!!node.inheritedFrom) {
            err.inherited = true;
        }
        return err;
    }

    public nodeWithPathToString(node: DeclarationNode, flat: boolean) {
        const ignoreKinds = ["Call signature", "Constructor signature"];
        let dp = flat ? '/' : '.';
        let path = node.path && 
            node.path.filter(x => x.name && ignoreKinds.indexOf(x.kindString) < 0)
            .map(x => x.name)
            .join(dp) || '';
        if (ignoreKinds.indexOf(node.kindString) < 0) {
            let split = path.length > 0 ? dp : ''; 
            return path + split + node.name;
        } else {
            return path;
        }
    }

    private getGlobalNode(node: DeclarationNode) {
        let globalNode = node;
        let pathIndex = node.path && (node.path.length - 1) || 0;
        while (pathIndex >= 0 && !isGlobalNode(globalNode, false)) {
            globalNode = node.path[pathIndex];
            pathIndex--;
        }
        return globalNode;
    }

    private tryFindNodeSourceFile(node: DeclarationNode, globalNode: DeclarationNode) {
        var findFilesRec = function(dir, result) {
            let files = fs.readdirSync(dir);
            for(let file of files) {
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
                    result.push({ path: filePath, content: fs.readFileSync(filePath, 'utf8')});
                }
              }
            }            
        }
        if (!this.sourceFiles) {
            this.sourceFiles = [];
            findFilesRec(this.options.mapToSourceDir, this.sourceFiles);
        }
        for (let fileInfo of this.sourceFiles) {
            let regexp: RegExp;
            if (globalNode.kindString == "Class")  {
                regexp = new RegExp(`class\\s*` + globalNode.name, "gm");
            } else if (globalNode.kindString == "Interface") {
                regexp = new RegExp(`interface\\s*` + globalNode.name, "gm");
            } else if (globalNode.kindString == "Variable") {
                regexp = new RegExp(`(var|const)\\s*` + globalNode.name, "gm");
            } else if (globalNode.kindString == "Function") {
                regexp = new RegExp(`function\\s*` + globalNode.name, "gm");
            }
            if (regexp.test(fileInfo.content)) {
                return fileInfo.path;
            }
        }
    }

    private isIgnored(nodeError: object) {
        return this.options.ignoreRules.find((rule) => {
            let match = true;
            for (let prop in rule) {
                if (Object.getOwnPropertyDescriptor(rule, prop) && prop != "comment") {
                    if (!nodeError[prop] || !(nodeError[prop] == rule[prop] || typeof(rule[prop]) == "string" && minimatch(nodeError[prop], rule[prop]))) {
                        match = false;
                        break;
                    }
                }
            }
            return match;
        });
    }

   
}
