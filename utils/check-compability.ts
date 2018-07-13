import { AppLogger } from "./app-logger";
import { pathsEqual, findNodeByNameRec } from "./node-operations";
import { DeclarationNode } from "./declaration-node";
import { checkSignaturesCompatible } from "./compare-signatures";


export function checkCompability(oldNode: DeclarationNode, newNode: DeclarationNode, log: AppLogger) {
    log.verbose(log.nodeWithPathToString(oldNode, true));
    
    if (oldNode.children) {
        let number = 0;
        let lastPercent = 0;
        for (let oldChildNode of oldNode.children) {
            oldChildNode.path = oldNode.path && [...oldNode.path, oldNode] || oldChildNode.path;

            let newChildNode = newNode.children && newNode.children.find(x => 
                x.name == oldChildNode.name && pathsEqual(x.path, oldChildNode.path));
            if (!newChildNode && newNode.kindString == "Type alias") {
                let refName = newNode.type.name;
                let refNode = findNodeByNameRec(newNode.path[0], refName);
                newChildNode = refNode && refNode.children && refNode.children.find(x => x.name == oldChildNode.name);
            }

            if (!newChildNode) {
                log.nodeNotFound(oldChildNode)
            } else {                
                checkSignaturesCompatible(oldChildNode, newChildNode, log);

                checkCompability(oldChildNode, newChildNode, log);
            }

            number++;
            if (!oldNode.path) {
                let percent = Math.round((number / oldNode.children.length)*100);
                if (percent - lastPercent >= 10) {
                    console.info(percent + "% complete");
                    lastPercent = percent;
                }                
            }
        }
    }
}