import Component from '@glimmer/component';

interface GlobalComponentSignature<Arg = string | undefined> {
  Element: HTMLDivElement;
}

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class NestedGlobalComponent extends Component<GlobalComponentSignature> {}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    'somedir/nested-global-component': typeof NestedGlobalComponent;
  }
}
