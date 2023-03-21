import { builders as b, type AST } from '@glimmer/syntax';
import type ScopeStack from './scope-stack';
import { headNotInScope } from './scope-stack';

const FALLBACK_DETAILS_MESSAGE =
  'See https://github.com/tildeio/ember-this-fallback#embroider-compatibility for more details.';

export type AmbiguousPathExpression = AST.PathExpression & {
  head: AST.VarHead;
};

type ExampleWrapper = (invocation: string) => string;

export function needsFallback(
  expr: AST.Expression,
  scope: ScopeStack
): expr is AmbiguousPathExpression {
  return expr.type === 'PathExpression' && headNotInScope(expr.head, scope);
}

export function mustacheNeedsFallback(
  node: AST.MustacheStatement,
  scope: ScopeStack
): node is AST.MustacheStatement & {
  params: [];
  hash: AST.Hash & { pairs: [] };
  path: AmbiguousPathExpression;
} {
  return (
    node.params.length === 0 &&
    node.hash.pairs.length === 0 &&
    needsFallback(node.path, scope)
  );
}

/**
 * Prefixes the `head` of the given `PathExpression` with `this`, making it a
 * `ThisHead`.
 *
 * For example:
 *
 * ```hbs
 * {{! before }}
 * {{global-helper property}}
 *
 * {{! after }}
 * {{global-helper this.property}}
 * ```
 *
 * or
 *
 * ```hbs
 * {{! before }}
 * {{property.value}}
 *
 * {{! after }}
 * {{this.property.value}}
 * ```
 */
export function expressionFallback(
  expr: AmbiguousPathExpression
): AST.PathExpression {
  const tail = `${expr.tail.length > 0 ? '.' : ''}${expr.tail.join('.')}`;
  const thisPath = `this.${expr.head.name}${tail}`;
  return b.path(thisPath, expr.loc);
}

/**
 * Performs `expressionFallback` only if `needsFallback` is `true`.
 */
export function maybeExpressionFallback(
  expr: AST.Expression,
  scope: ScopeStack
): AST.Expression {
  return needsFallback(expr, scope) ? expressionFallback(expr) : expr;
}

/**
 * Wraps an ambiguous expression with the `this-fallback/is-helper` helper to
 * determine if it is a helper at runtime and fallback to the `this` property if
 * not.
 *
 * This logic is contained within a `SubExpression` that can be used to replace
 * the ambiguous expression in the parent as shown below:
 *
 * ```hbs
 * {{! before }}
 * <Parent id={{property}} />
 *
 * {{! after }}
 * <Parent
 *   id={{(if
 *     (this-fallback/is-helper "property")
 *     (helper (this-fallback/lookup-helper "property"))
 *     this.property
 *   )}}
 * />
 * ```
 */
export function ambiguousAttrFallback(
  expr: AmbiguousPathExpression
): AST.SubExpression {
  const headName = expr.head.name;
  return b.sexpr('if', [
    b.sexpr('this-fallback/is-helper', [b.string(headName)]),
    // We can't just to `b.sexpr(headName)` bc that will cause the
    // compiler to attempt to compile a helper with the name
    // `headName` even if it doesn't exist.
    b.sexpr('this-fallback/lookup-helper', [b.string(headName)]),
    b.path(`this.${headName}`),
  ]);
}

/**
 * Wraps an ambiguous expression with the `this-fallback/is-invocable` helper to
 * determine if it is a component or helper at runtime and fallback to the
 * `this` property if not.
 *
 * This logic is contained within a `BlockStatement` that can be used to replace
 * the ambiguous expression in the parent as shown below:
 *
 * ```hbs
 * {{! before }}
 * {{property}}
 *
 * {{! after }}
 * {{#if (this-fallback/is-invocable "property")}}
 *   {{property}}
 * {{else}}
 *   {{this.property}}
 * {{/if}}
 * ```
 */
export function ambiguousStatementFallback(
  expr: AmbiguousPathExpression,
  node: AST.MustacheStatement
): AST.Statement {
  const headName = expr.head.name;
  return b.block(
    'if',
    [b.sexpr('this-fallback/is-invocable', [b.string(headName)])],
    null,
    b.blockItself([b.mustache(headName)]),
    b.blockItself([b.mustache(b.path(`this.${headName}`))]),
    node.loc
  );
}

export function ambiguousAttrFallbackWarning(
  expr: AmbiguousPathExpression,
  parent: AST.AttrNode
): string[] {
  const headName = expr.head.name;
  const exampleWrapper: ExampleWrapper = (invocation) =>
    `${parent.name}=${invocation}`;
  const original = exampleWrapper(`{{${headName}}}`);

  return [
    `Found ambiguous mustache statement as attribute node value: \`${original}\`.`,
    `Falling back to runtime dynamic resolution. You can avoid this fallback by:`,
    `- ${explicitHelperSuggestion(headName, exampleWrapper)}`,
    `- ${thisPropertySuggestion(headName, exampleWrapper)}`,
    FALLBACK_DETAILS_MESSAGE,
  ];
}

export function ambiguousStatementFallbackWarning(
  expr: AmbiguousPathExpression
): string[] {
  const headName = expr.head.name;

  return [
    `Found ambiguous mustache statement: \`{{${headName}}}\`.`,
    `Falling back to runtime dynamic resolution. You can avoid this fallback by:`,
    `- ${explicitHelperSuggestion(headName)}`,
    `- ${explicitComponentSuggestion(headName)}`,
    `- ${thisPropertySuggestion(headName)}`,
    FALLBACK_DETAILS_MESSAGE,
  ];
}

function explicitComponentSuggestion(name: string): string {
  const invocation = `<${name.charAt(0).toUpperCase()}${name.slice(1)} />`;
  return `explicitly invoking a known component with angle-brackets: \`${invocation}\``;
}

function explicitHelperSuggestion(name: string, wrap?: ExampleWrapper): string {
  wrap = wrap ?? ((invocation): string => invocation);
  const invocation = wrap(`{{(${name})}}`);
  return `explicitly invoking a known helper with parens: \`${invocation}\``;
}

function thisPropertySuggestion(name: string, wrap?: ExampleWrapper): string {
  wrap = wrap ?? ((invocation): string => invocation);
  const invocation = wrap(`{{this.${name}}}`);
  return `prefacing a known property on \`this\` with \`this\`: \`${invocation}\``;
}
