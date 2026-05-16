/**
 * Recursive evolution tree. Each node carries the species id + name plus
 * its outgoing branches (`evolvesTo`). Most chains are linear (length 0,
 * 1 or 2), but a few are wide (Eevee, Wurmple, Tyrogue) — the recursive
 * type keeps both shapes representable without flag fields.
 */
export interface EvolutionNode {
  readonly speciesId: number;
  readonly speciesName: string;
  readonly evolvesTo: readonly EvolutionNode[];
}

export interface EvolutionChain {
  readonly id: number;
  readonly root: EvolutionNode;
}

/**
 * Walk the tree depth-first and produce a flat list of nodes in display
 * order. Useful for renderers that draw a single horizontal sequence
 * with arrows between siblings.
 */
export const flattenEvolutionChain = (chain: EvolutionChain): readonly EvolutionNode[] => {
  const out: EvolutionNode[] = [];
  const visit = (node: EvolutionNode): void => {
    out.push(node);
    for (const child of node.evolvesTo) visit(child);
  };
  visit(chain.root);
  return out;
};
