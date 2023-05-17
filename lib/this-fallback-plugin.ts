import {
  builders as b,
  print,
  type AST,
  type ASTPlugin,
  type ASTPluginBuilder,
  type ASTPluginEnvironment,
  type NodeVisitor,
  type SourceSpan,
  type WalkerPath,
} from '@glimmer/syntax';
import {
  type JSUtils,
  type WithJSUtils,
} from 'babel-plugin-ember-template-compilation';
import { assertIsNode, isNode } from './helpers/ast';
import {
  deprecationOptionsFor,
  type Deprecation,
  type DeprecationOptions,
} from './helpers/deprecations';
import {
  ambiguousAttrFallbackWarning,
  ambiguousStatementFallback,
  ambiguousStatementFallbackWarning,
  buildtimeExpressionFallback,
  helperOrExpressionFallback,
  maybeAddDeprecationsHelper,
  mustacheNeedsFallback,
  needsFallback,
  wrapWithTryLookup,
} from './helpers/fallback';
import createLogger, { noopLogger, type Logger } from './helpers/logger';
import ScopeStack, { unusedNameLike } from './helpers/scope-stack';
import { squish } from './helpers/string';
import { type EmberThisFallbackOptions } from './options';
import assert from './types/assert';

type Env = WithJSUtils<ASTPluginEnvironment> & {
  moduleName: string;
};

class ThisFallbackPlugin implements ASTPlugin {
  private readonly deprecations: Deprecation[] = [];

  private readonly bindImport: JSUtils['bindImport'] = (...args) =>
    this.env.meta.jsutils.bindImport(...args);

  constructor(
    readonly name: string,
    private readonly env: Env,
    private readonly logger: Logger
  ) {}

  readonly visitor: NodeVisitor = {
    Template: this.handleTemplate(),

    Block: this.handleBlock<AST.Block>(),

    ElementNode: {
      keys: { children: this.handleBlock<AST.ElementNode>() },
      ...this.handleAttrNodes(),
    },

    MustacheStatement: {
      ...this.handleCall<AST.MustacheStatement>(),
      ...this.handleMustache(),
    },

    BlockStatement: this.handleCall<AST.BlockStatement>(),
    ElementModifierStatement: this.handleCall<AST.ElementModifierStatement>(),
    SubExpression: this.handleCall<AST.SubExpression>(),
  };

  private readonly scopeStack = new ScopeStack();

  private handleBlock<N extends AST.Block | AST.ElementNode>(): {
    enter: (node: N) => void;
    exit: () => void;
  } {
    return {
      enter: (node): void => {
        this.scopeStack.push(node.blockParams);
      },
      exit: (): void => {
        this.scopeStack.pop();
      },
    };
  }

  private handleAttrNodes(): {
    enter: (
      node: AST.ElementNode,
      path: WalkerPath<AST.ElementNode>
    ) => AST.ElementNode | AST.BlockStatement;
  } {
    return {
      enter: (
        elementNode,
        elementPath
      ): AST.ElementNode | AST.BlockStatement => {
        const ambiguousHeads = new Map<string, SourceSpan>();
        const blockParamName = unusedNameLike('maybeHelpers', this.scopeStack);
        for (const attrNode of elementNode.attributes) {
          const value = attrNode.value;
          if (
            isNode(value, 'MustacheStatement') &&
            mustacheNeedsFallback(value, this.scopeStack)
          ) {
            // redundant but necessary because of overly strict types in @glimmer/syntax
            assertIsNode(attrNode.value, 'MustacheStatement');
            if (attrNode.name.startsWith('@')) {
              this.deprecateFallback(value.path.head.name);
              attrNode.value.path = buildtimeExpressionFallback(value.path);
            } else {
              ambiguousHeads.set(value.path.head.name, value.loc);
              attrNode.value.path = helperOrExpressionFallback(
                blockParamName,
                value,
                this.makeFallbackDeprecation(value.path.head.name),
                { bindImport: this.bindImport, bindingTarget: elementPath }
              );
            }
          } else if (isNode(value, 'ConcatStatement')) {
            for (const part of value.parts) {
              const p = part;
              if (
                isNode(p, 'MustacheStatement') &&
                mustacheNeedsFallback(p, this.scopeStack)
              ) {
                // redundant but necessary because of overly strict types in @glimmer/syntax
                assertIsNode(part, 'MustacheStatement');
                ambiguousHeads.set(p.path.head.name, p.loc);
                part.path = helperOrExpressionFallback(
                  blockParamName,
                  p,
                  this.makeFallbackDeprecation(p.path.head.name),
                  { bindImport: this.bindImport, bindingTarget: elementPath }
                );
              }
            }
          }
        }

        if (ambiguousHeads.size > 0) {
          // Only logs the first one to avoid mega-log-spew.
          const firstIssue = [...ambiguousHeads.entries()][0]!;
          this.logger.warn({
            message: ambiguousAttrFallbackWarning(firstIssue[0]),
            loc: firstIssue[1],
          });
          return wrapWithTryLookup(
            elementPath.node,
            new Set(ambiguousHeads.keys()),
            blockParamName,
            { bindImport: this.bindImport, bindingTarget: elementPath }
          );
        } else {
          return elementNode;
        }
      },
    };
  }

  private handleCall<N extends AST.CallNode>(): {
    keys: {
      params: (node: N) => void;
      hash: (node: N) => void;
    };
  } {
    return {
      keys: {
        params: (node): void => {
          const { scopeStack } = this;
          node.params = node.params.map((expr) => {
            if (needsFallback(expr, scopeStack)) {
              this.deprecateFallback(expr.head.name);
              return buildtimeExpressionFallback(expr);
            } else {
              return expr;
            }
          });
        },
        hash: (node): void => {
          const { scopeStack } = this;
          node.hash.pairs = node.hash.pairs.map((pair) => {
            const { key, value: expr, loc } = pair;
            if (needsFallback(expr, scopeStack)) {
              this.deprecateFallback(expr.head.name);
              return b.pair(key, buildtimeExpressionFallback(expr), loc);
            } else {
              return pair;
            }
          });
        },
      },
    };
  }

  private handleMustache(): {
    enter: (
      node: AST.MustacheStatement,
      path: WalkerPath<AST.MustacheStatement>
    ) => AST.MustacheStatement | AST.BlockStatement;
  } {
    return {
      enter: (node, path): AST.MustacheStatement | AST.BlockStatement => {
        // Alias node to n so that the type of `node` doesn't get narrowed,
        // which prevents mutation
        const n = node;
        if (mustacheNeedsFallback(n, this.scopeStack)) {
          assert(
            'unexpected AmbiguousMustacheExpression in attribute value',
            path.parentNode?.type !== 'AttrNode'
          );
          if (n.path.tail.length > 0) {
            this.deprecateFallback(n.path.head.name);
            node.path = buildtimeExpressionFallback(n.path);
            return node;
          } else {
            this.logger.warn({
              message: ambiguousStatementFallbackWarning(n.path.head.name),
              loc: node.loc,
            });
            return ambiguousStatementFallback(
              n,
              path,
              this.scopeStack,
              this.makeFallbackDeprecation(n.path.head.name),
              { bindImport: this.bindImport, bindingTarget: path }
            );
          }
        }
        return node;
      },
    };
  }

  private handleTemplate(): {
    enter: (node: AST.Template) => void;
    exit: (node: AST.Template, path: WalkerPath<AST.Template>) => void;
  } {
    return {
      enter: (node): void => {
        this.logger.debug("before: '%s'", squish(print(node)));
      },
      exit: (node, path): void => {
        this.logger.debug("after_: '%s'", squish(print(node)));
        if (this.scopeStack.size !== 1) {
          throw new Error(
            `unbalanced ScopeStack push and pop, ScopeStack size is ${this.scopeStack.size}`
          );
        }

        maybeAddDeprecationsHelper(node, this.deprecations, {
          bindImport: this.bindImport,
          bindingTarget: path,
        });
      },
    };
  }

  private deprecate(
    message: string,
    test: unknown,
    options: DeprecationOptions
  ): void {
    if (!test) {
      this.deprecations.push([message, false, options]);
    }
  }

  private deprecateFallback(headName: string): void {
    this.deprecate(...this.makeFallbackDeprecation(headName));
  }

  private makeFallbackDeprecation(headName: string): Deprecation {
    return [
      // Matches message from https://github.com/glimmerjs/glimmer-vm/pull/1259
      `The \`${headName}\` property path was used in the \`${this.env.moduleName}\` template without using \`this\`. This fallback behavior has been deprecated, all properties must be looked up on \`this\` when used in the template: {{this.${headName}}}`,
      false,
      deprecationOptionsFor('this-property-fallback'),
    ];
  }
}

class NoopPlugin implements ASTPlugin {
  constructor(readonly name: string) {}
  visitor = {};
}

function buildThisFallbackPlugin({
  enableLogging,
}: EmberThisFallbackOptions): ASTPluginBuilder<Env> {
  return (env) => {
    const name = 'ember-this-fallback';
    const logger = enableLogging
      ? createLogger(`${name}-plugin`, env.moduleName)
      : noopLogger();

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (env.meta.jsutils) {
      return new ThisFallbackPlugin(name, env, logger);
    } else {
      const errorMessage = [
        'The this-fallback-plugin relies on the JSUtils from babel-plugin-ember-template-compilation, but none were found.',
        'To resolve this issue, please ensure you are running the latest version of ember-cli-htmlbars.',
      ];
      if (enableLogging) {
        logger.error([
          'The this-fallback-plugin relies on the JSUtils from babel-plugin-ember-template-compilation, but none were found.',
          'To resolve this issue, please ensure you are running the latest version of ember-cli-htmlbars.',
        ]);
        return new NoopPlugin(name);
      } else {
        throw new Error(errorMessage.join(' '));
      }
    }
  };
}

export = buildThisFallbackPlugin;
