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
import { isNode } from './helpers/ast';
import {
  ambiguousAttrFallbackWarning,
  ambiguousStatementFallback,
  ambiguousStatementFallbackWarning,
  expressionFallback,
  helperOrExpressionFallback,
  maybeExpressionFallback,
  mustacheNeedsFallback,
  wrapWithTryLookup,
} from './helpers/fallback';
import createLogger, { type Logger } from './helpers/logger';
import ScopeStack, { unusedNameLike } from './helpers/scope-stack';
import { squish } from './helpers/string';
import assert from './types/assert';

type Env = WithJSUtils<ASTPluginEnvironment> & {
  moduleName: string;
};

class ThisFallbackPlugin implements ASTPlugin {
  constructor(
    readonly name: string,
    private readonly env: Env,
    private readonly logger: Logger
  ) {}

  readonly visitor: NodeVisitor = {
    Template: this.handleDebug(),

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
            !attrNode.name.startsWith('@') &&
            isNode(value, 'MustacheStatement') &&
            mustacheNeedsFallback(value, this.scopeStack)
          ) {
            // redundant but necessary because of overly strict types in @glimmer/syntax
            assert(
              'attrNode.value is not a MustacheStatement',
              isNode(attrNode.value, 'MustacheStatement')
            );
            ambiguousHeads.set(value.path.head.name, value.loc);
            attrNode.value.path = helperOrExpressionFallback(
              blockParamName,
              value
            );
          } else if (isNode(value, 'ConcatStatement')) {
            for (const part of value.parts) {
              const p = part;
              if (
                isNode(p, 'MustacheStatement') &&
                mustacheNeedsFallback(p, this.scopeStack)
              ) {
                // redundant but necessary because of overly strict types in @glimmer/syntax
                assert(
                  'part is not a MustacheStatement',
                  isNode(part, 'MustacheStatement')
                );
                ambiguousHeads.set(p.path.head.name, p.loc);
                part.path = helperOrExpressionFallback(blockParamName, p);
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
            elementPath,
            elementPath.node,
            new Set(ambiguousHeads.keys()),
            blockParamName,
            this.bindImport
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
          node.params = node.params.map((expr) =>
            maybeExpressionFallback(expr, this.scopeStack)
          );
        },
        hash: (node): void => {
          node.hash.pairs = node.hash.pairs.map(({ key, value: expr, loc }) =>
            b.pair(key, maybeExpressionFallback(expr, this.scopeStack), loc)
          );
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
            path.parentNode?.type !== 'AttrNode' ||
              path.parentNode.name.startsWith('@')
          );
          if (n.path.tail.length > 0) {
            node.path = expressionFallback(n.path);
            return node;
          } else {
            this.logger.warn({
              message: ambiguousStatementFallbackWarning(n.path.head.name),
              loc: node.loc,
            });
            return ambiguousStatementFallback(
              n,
              path,
              this.bindImport,
              this.scopeStack
            );
          }
        }
        return node;
      },
    };
  }

  private readonly bindImport: JSUtils['bindImport'] = (...args) =>
    this.env.meta.jsutils.bindImport(...args);

  private handleDebug(): {
    enter: (node: AST.Template) => void;
    exit: (node: AST.Template) => void;
  } {
    return {
      enter: (node): void => {
        this.logger.debug("before: '%s'", squish(print(node)));
      },
      exit: (node): void => {
        this.logger.debug("after_: '%s'", squish(print(node)));
        if (this.scopeStack.size !== 1) {
          throw new Error(
            `unbalanced ScopeStack push and pop, ScopeStack size is ${this.scopeStack.size}`
          );
        }
      },
    };
  }
}

class NoopPlugin implements ASTPlugin {
  constructor(readonly name: string) {}
  visitor = {};
}

const buildThisFallbackPlugin: ASTPluginBuilder<Env> = (env) => {
  const name = 'ember-this-fallback';
  const logger = createLogger(`${name}-plugin`, env.moduleName);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (env.meta.jsutils) {
    return new ThisFallbackPlugin(name, env, logger);
  } else {
    logger.error([
      'The this-fallback-plugin relies on the JSUtils from babel-plugin-ember-template-compilation, but none were found.',
      'To resolve this issue, please ensure you are running the latest version of ember-cli-htmlbars.',
    ]);
    return new NoopPlugin(name);
  }
};

export = buildThisFallbackPlugin;
