import { AppLogger } from "./app-logger";
import { pathsEqual, findNodeByNameRec } from "./node-operations";
import { DeclarationNode } from "./declaration-node";
import { checkSignaturesCompatible } from "./compare-signatures";


export function checkCompability(oldNodes: DeclarationNode[], newNodes: DeclarationNode[], log: AppLogger, comparePaths: boolean) {
    let number = 0;
    let lastPercent = 0;
    for (let oldNode of oldNodes) {
        let newNode = newNodes.find(x => x.name == oldNode.name &&
            (!comparePaths || pathsEqual(x.path, oldNode.path)));

        if (!newNode) {
            log.nodeNotFound(oldNode)
        } else {                
            checkSignaturesCompatible(oldNode, newNode, log);
            checkCompabilityRec(oldNode, newNode, log);
        }

        number++;
        let percent = Math.round((number / oldNodes.length)*100);
        if (percent - lastPercent >= 10) {
            console.info(percent + "% complete");
            lastPercent = percent;
        }
    }
    
}

export function checkCompabilityRec(oldNode: DeclarationNode, newNode: DeclarationNode, log: AppLogger) {
    log.verbose(log.nodeWithPathToString(oldNode, true));
    
    if (oldNode.children) {
        for (let oldChildNode of oldNode.children) {
            oldChildNode.path = oldNode.path && [...oldNode.path, oldNode] || oldChildNode.path;

            let newChildNode = newNode.children && newNode.children.find(x => x.name == oldChildNode.name);
            if (!newChildNode && newNode.kindString == "Type alias") {
                let refName = newNode.type.name;
                let refNode = findNodeByNameRec(newNode.path[0], refName);
                newChildNode = refNode && refNode.children && refNode.children.find(x => x.name == oldChildNode.name);
            }

            if (!newChildNode) {
                log.nodeNotFound(oldChildNode)
            } else {                
                checkSignaturesCompatible(oldChildNode, newChildNode, log);
                checkCompabilityRec(oldChildNode, newChildNode, log);
            }            
        }
    }
}