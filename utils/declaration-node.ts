export interface DeclarationNode<Kind = KindString> {
    name: string;
    id: number;
    children: DeclarationNode[];
    path?: DeclarationNode[];
    type?: DeclarationType;
    kindString?: Kind;
    flags?: { isProtected: Boolean, isOptional: Boolean, isExported: Boolean };
    inheritedFrom?: { name: string };
    signatures?: DeclarationNode<"Call signature">[];
    parameters?: DeclarationNode<"Parameter">[];
    
}
export interface RoodDeclarationNode extends DeclarationNode {
    idMap: {[id: string]: DeclarationNode};
}

export interface DeclarationType {
    name?: string;
    id?: number;
    type?: string;
    elementType: DeclarationNode;
    typeArguments?: DeclarationType[];
}

export type KindString = "Class" | "Interface" | "Variable"| "Function"| "Type alias" 
    | "Call signature" | "Parameter" | "Module" | "Constructor" | "Constructor signature" 
    | "Method" | "Property" | "Type literal" | "Variable";
