import {
  type ASTPlugin,
  type ASTPluginBuilder,
  type ASTPluginEnvironment,
  type NodeVisitor,
} from '@glimmer/syntax';

class HelloPlugin implements ASTPlugin {
  name = 'hello';
  visitor: NodeVisitor = {
    CommentStatement: (node) => {
      return this.env.syntax.builders.text(`Hello, ${node.value}!`);
    },
  };

  constructor(private readonly env: ASTPluginEnvironment) {}
}

const buildHelloPlugin: ASTPluginBuilder = (env) => {
  return new HelloPlugin(env);
};

export = buildHelloPlugin;
