import { squish } from 'dummy/lib/string';
import { modifier } from 'ember-modifier';

export interface GlobalModifierSignature {
  Element: HTMLElement;
  Args: {
    Positional?: [positionalArg?: string | undefined];
    Named?: { arg?: string | undefined };
  };
}

const globalModifier = modifier<GlobalModifierSignature>(
  (element, positional, named) => {
    const positionalArg = (positional ?? [])[0] ?? '';
    const namedArg = (named ?? { arg: '' }).arg ?? '';
    element.textContent = squish(
      `global-modifier-result ${positionalArg} ${namedArg}`
    );
  }
);

export default globalModifier;

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    /** A helper for testing ElementModifierStatement handling. */
    'global-modifier': typeof globalModifier;
  }
}
