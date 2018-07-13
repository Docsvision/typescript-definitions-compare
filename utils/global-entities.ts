import { DeclarationNode } from "./declaration-node";

export const globalEnities = ["Class", "Interface", "Variable", "Function", "Type alias"];

export function isGlobalNode(node: DeclarationNode) {
    return node && globalEnities.indexOf(node.kindString) >= 0;
}