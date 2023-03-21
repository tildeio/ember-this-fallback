import { type AST, type WalkerPath } from '@glimmer/syntax';

/**
 * Replaces the given node with the given replacement.
 *
 * @param node The child node to replace
 * @param path The path containing the parentNode within which we will replace
 * the child
 * @param replacement The Statement node with which to replace the child node
 */
export function replaceChild<N extends AST.Statement>(
  node: N,
  path: WalkerPath<N>,
  replacement: AST.Statement
): void {
  const parent = path.parentNode;
  if (parent) {
    const parentChildren = getChildren(parent);
    const index = parentChildren.indexOf(node);
    if (index === -1) {
      throw new Error('could not find given node in parent children');
    }
    parentChildren.splice(index, 1, replacement);
  } else {
    throw new Error('expected node to have a parent node');
  }
}

function getChildren(node: AST.Node): AST.Statement[] {
  switch (node.type) {
    case 'Block':
    case 'Template': {
      return node.body;
    }
    case 'ElementNode': {
      return node.children;
    }
    default: {
      throw new Error(
        `could not find children for node with type ${node.type}`
      );
    }
  }
}
