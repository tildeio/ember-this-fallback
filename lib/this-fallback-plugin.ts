import {
  builders as b,
  print,
  type AST,
  type ASTPlugin,
  type ASTPluginBuilder,
  type ASTPluginEnvironment,
  type NodeVisitor,
  type WalkerPath,
} from '@glimmer/syntax';
import type { WithJSUtils } from 'babel-plugin-ember-template-compilation';
import { replaceChild } from './helpers/ast';
import {
  ambiguousAttrFallback,
  ambiguousAttrFallbackWarning,
  ambiguousStatementFallback,
  ambiguousStatementFallbackWarning,
  expressionFallback,
  maybeExpressionFallback,
  mustacheNeedsFallback,
} from './helpers/fallback';
import createLogger from './helpers/logger';
import ScopeStack from './helpers/scope-stack';
import { squish } from './helpers/string';

type Env = WithJSUtils<ASTPluginEnvironment> & {
  moduleName: string;
};

class ThisFallbackPlugin implements ASTPlugin {
  readonly name = 'ember-this-fallback';

  constructor(private readonly env: Env) {}

  readonly visitor: NodeVisitor = {
    Template: this.handleDebug(),

    Block: this.handleBlock<AST.Block>(),
    ElementNode: { keys: { children: this.handleBlock<AST.ElementNode>() } },

    MustacheStatement: {
      ...this.handleCall<AST.MustacheStatement>(),
      ...this.handleMustache(),
    },
    BlockStatement: this.handleCall<AST.BlockStatement>(),
    ElementModifierStatement: this.handleCall<AST.ElementModifierStatement>(),
    SubExpression: this.handleCall<AST.SubExpression>(),
  };

  private readonly scopeStack = new ScopeStack();

  private readonly logger = createLogger(
    `${this.name}-plugin`,
    this.env.moduleName
  );

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
    ) => void;
  } {
    return {
      enter: (node, path): void => {
        // Alias node to n so that the type of `node` doesn't get narrowed,
        // which prevents mutation
        const n = node;
        if (mustacheNeedsFallback(n, this.scopeStack)) {
          if (n.path.tail.length > 0) {
            node.path = expressionFallback(n.path);
          } else if (path.parentNode?.type !== 'AttrNode') {
            this.logger.warn(ambiguousStatementFallbackWarning(n.path));
            replaceChild(node, path, ambiguousStatementFallback(n.path, n));
          } else if (!path.parentNode.name.startsWith('@')) {
            this.logger.warn(
              ambiguousAttrFallbackWarning(n.path, path.parentNode)
            );
            node.path = ambiguousAttrFallback(n.path);
          }
        }
      },
    };
  }

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
      },
    };
  }
}

const buildThisFallbackPlugin: ASTPluginBuilder<Env> = (env) =>
  new ThisFallbackPlugin(env);

export = buildThisFallbackPlugin;
