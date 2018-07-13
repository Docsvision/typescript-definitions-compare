import { DeclarationNode, RoodDeclarationNode } from "./declaration-node";

export function pathsEqual(path1: DeclarationNode[], path2: DeclarationNode[]) {
    if (!path1 && path2 || !path2 && path1) return false;
    if (path1.length != path2.length ) return false;
    // Skip first root service item
    for (let i = 1; i < path1.length; i++) {
        if (path1[i].name  != path2[i].name) {
            return false;
        }
    }
    return true;
}

export function findNodeByNameRec(current: DeclarationNode, nodeName: string): DeclarationNode | undefined {
    if (current && current.name == nodeName) {
        return current;
    } else if (current && current.children) {
        for (let child of current.children) {
            let found = findNodeByNameRec(child, nodeName);
            if (found)
                return found;
        }
    }
}

export function findNodeByIdRec(current: DeclarationNode, nodeId: number): DeclarationNode | undefined {
    return ((current.path[0] || current) as RoodDeclarationNode).idMap[nodeId];
}

export function resolveTypeAlias(rootNode: DeclarationNode, typeId: number): DeclarationNode | undefined {
    let typeNode = findNodeByIdRec(rootNode, typeId);
    if (typeNode && typeNode.kindString == "Type alias") {
        typeNode = findNodeByIdRec(rootNode, typeNode.type.id);
    }
    return typeNode;
}