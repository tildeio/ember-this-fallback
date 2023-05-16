import { type AST } from '@glimmer/syntax';
import assert from '../types/assert';

export function isNode<Type extends AST.Node['type']>(
  value: AST.Node | null | undefined,
  type?: Type | undefined
): value is Extract<AST.Node, { type: Type }> {
  return type ? value?.type === type : !!value;
}

export function assertIsNode<Type extends AST.Node['type']>(
  value: AST.Node,
  type?: Type | undefined
): asserts value is AST.MustacheStatement {
  assert(`value is not a ${type ?? 'Node'}`, isNode(value, type));
}
