import { helper } from '@ember/component/helper';
import { squish } from 'dummy/lib/string';

interface GlobalHelperSignature {
  Args: {
    Positional?: [positionalArg?: string | undefined];
    Named?: { arg?: string | undefined };
  };
  Return: string;
}

const globalHelper = helper<GlobalHelperSignature>((positional, named) => {
  const positionalArg = (positional ?? [])[0] ?? '';
  const namedArg = (named ?? { arg: '' }).arg ?? '';
  return squish(`global-helper-result ${positionalArg} ${namedArg}`);
});

export default globalHelper;

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    /** A helper that exists (for testing this-fallback/try-lookup-helper). */
    'global-helper': typeof globalHelper;
  }
}
