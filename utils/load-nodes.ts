import { isGlobalNode } from "./global-entities";
import { DeclarationNode } from "./declaration-node";

export function loadNodes(node: DeclarationNode, path: any[], valuableNodes: any[], exportedOnly) {
    node.path = path;
    if (path[0]) {
        path[0].idMap = path[0].idMap || {};
        path[0].idMap[node.id] = node;
    }
    if (isGlobalNode(node, exportedOnly)) {
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
