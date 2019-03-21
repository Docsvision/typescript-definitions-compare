import { DeclarationNode } from "./declaration-node";

export const globalEntities = ["Class", "Interface", "Variable", "Function", "Type alias"];

export function isGlobalNode(node: DeclarationNode, exportedOnly: boolean) {
    return node && globalEntities.indexOf(node.kindString) >= 0 && (!exportedOnly ||
        (node.flags.isExported || (node.path && node.path.length > 0 && node.path[node.path.length-1].flags.isExported)));
}