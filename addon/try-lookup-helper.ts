import Helper from '@ember/component/helper';
import { getOwner } from './get-owner';
import { assertExists } from './types/util';

type Positional = [name: string];

interface TryLookupHelperSignature {
  Args: {
    Positional: Positional;
  };
  // NOTE: Actual type is `Factory<object> | undefined`, but due to
  // discrepancies in the Factory type between the 4.8 and 4.10 Ember types, we
  // can't use that type here.
  Return: unknown;
}

/**
 * Returns the helper `Factory` for the helper with the provided name if it
 * exists and `undefined` if not.
 * Similar to `helper` helper, but avoids build-time errors for
 * this-fallback invocations.
 */
export default class TryLookupHelper extends Helper<TryLookupHelperSignature> {
  compute([name]: Positional): unknown {
    const owner = assertExists(getOwner(this), 'Could not find owner');
    return owner.factoryFor(`helper:${name}`)?.class;
  }
}
