import Helper from '@ember/component/helper';
import { assert } from '@ember/debug';
import { type HelperLike } from '@glint/template';
import { getOwner } from '../../get-owner';
import { assertExists } from '../../types/util';

type Positional = [name: string];

interface LookupHelperSignature {
  Args: {
    Positional: Positional;
  };
  Return: HelperLike;
}

export default class LookupHelper extends Helper<LookupHelperSignature> {
  compute([name]: Positional): HelperLike {
    const owner = assertExists(getOwner(this), 'Could not find owner');
    const helper = owner.lookup(`helper:${name}`);
    assert(`Expected to find helper with name ${name}`, helper);
    return helper as HelperLike;
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    /**
     * Returns the helper with the provided name. Asserts it's existence.
     * Similar to `helper` helper, but avoids build-time errors for
     * this-fallback invocations.
     */
    'this-fallback/lookup-helper': typeof LookupHelper;
  }
}
