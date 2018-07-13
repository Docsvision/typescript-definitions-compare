import { DeclarationNode } from "./declaration-node";
import { AppLogger } from "./app-logger";
import { findNodeByNameRec, findNodeByIdRec, resolveTypeAlias } from "./node-operations";

export function checkSignaturesCompatible(oldNode: DeclarationNode, newNode: DeclarationNode, log: AppLogger ) {
    if (oldNode.signatures && newNode.signatures) {
        for (let oldSingature of oldNode.signatures) {
            let matched = newNode.signatures.find(newSignature => 
                checkSignatures(oldSingature, newSignature, log));
            if (!matched) {
                return false;
            }
        }
        return true;
    } else {
        return checkSignatures(oldNode, newNode, log);
    }
}

function checkSignatures(oldSingature: DeclarationNode, newSignature: DeclarationNode, log: AppLogger)  {
    let result = true;

    // Check return value
    let oldReturnType = resolveAcutalType(oldSingature);
    let newReturnType = resolveAcutalType(newSignature);
    if (oldReturnType && newReturnType && oldReturnType.name != newReturnType.name) {
        let oldType = resolveTypeAlias(oldSingature.path[0], oldReturnType.id)
        let newType = resolveTypeAlias(newSignature.path[0], newReturnType.id)
        let incompablity = oldType && newType && findTypesIncopability(oldType, newType);
        if (oldType && newType && oldType.name != newType.name && incompablity) {
            log.changedReturnType(newSignature, oldType, newType, incompablity);
            result = false;
        }
    }

    if (oldSingature.parameters && newSignature.parameters) {
        for (let i =0; i < newSignature.parameters.length; i++) {
            let oldParam = oldSingature.parameters[i];
            let newParam = newSignature.parameters[i];

            if (newParam && !oldParam  && !newParam.flags.isOptional) {
                log.addedNotOptionalParam(newParam);
                result = false;
            } else if (newParam && oldParam) {
                if (newParam.type.name != oldParam.type.name) {
                    let oldType = resolveTypeAlias(oldSingature.path[0], oldParam.type.id)
                    let newType = resolveTypeAlias(newSignature.path[0], newParam.type.id)
                    let incompablity = oldType && newType && findTypesIncopability(oldType, newType);
                    if (oldType && newType && oldType.name != newType.name && incompablity) {
                        log.changedParamType(newParam, oldType, newType, incompablity);
                        result = false;
                    }
                }
            }
        }
    }
    if (oldSingature.parameters && !newSignature.parameters) result = false;
    if (!oldSingature.parameters && newSignature.parameters) result = false;

    return result;
}

function resolveAcutalType(node: DeclarationNode) {
    if (node.type && node.type.type == "array") {
        return node.type.elementType;
    } else if (node.type && (node.type.name == "JQueryDeferred" || node.type.name == "Promise") && node.type.typeArguments) {
        return node.type.typeArguments[0];
    } else {
        return node.type;
    }
}

function findTypesIncopability(oldType: DeclarationNode, newType: DeclarationNode) {
    if (oldType.children && newType.children) {
        for (let oldChild of oldType.children) {
            let newChild = newType.children.find(x => x.name == oldChild.name);
            let oldChildOptional = oldChild.flags && oldChild.flags.isOptional;
            if (!newChild && !oldChildOptional) {
                return oldChild;
            }
        }
    }
    return null;
}