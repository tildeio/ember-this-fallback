import { type AST } from '@glimmer/syntax';

export function isNode<Type extends AST.Node['type']>(
  value: AST.Node | null | undefined,
  type?: Type | undefined
): value is Extract<AST.Node, { type: Type }> {
  return type ? value?.type === type : !!value;
}
