import Component from '@glimmer/component';

interface GlobalComponentSignature<Arg = string | undefined> {
  Element: HTMLDivElement;
  Args: {
    arg?: Arg;
  };
  Blocks: {
    default: [arg?: Arg];
  };
}

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class GlobalComponent extends Component<GlobalComponentSignature> {}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    /** A component that exists (for testing this-fallback/is-invocable). */
    GlobalComponent: typeof GlobalComponent;
    /** A component that exists (for testing this-fallback/is-invocable). */
    'global-component': typeof GlobalComponent;
  }
}
