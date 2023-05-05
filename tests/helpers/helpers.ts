import { helper } from '@ember/component/helper';
import { squish } from 'dummy/lib/string';

// NOTE: We can't use function as helper because we support Ember versions <4.5
export const localHelperPositional = helper(([positionalArg]: [string]) =>
  squish(`local-helper-result ${positionalArg}`)
);

export const localHelperNamed = helper(
  (_positional: never[], { arg }: { arg: string }) =>
    squish(`local-helper-result ${arg}`)
);

export const stringify = helper(([positionalArg]: [unknown]) =>
  String(positionalArg)
);
