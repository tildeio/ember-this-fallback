import Helper from '@ember/component/helper';
import { getOwner } from './get-owner';
import { assertExists } from './types/util';

type Positional = [name: string];

interface IsHelperSignature {
  Args: {
    Positional: Positional;
  };
  Return: boolean;
}

/** Checks if a helper with the provided name exists. */
export default class IsHelper extends Helper<IsHelperSignature> {
  compute([name]: Positional): boolean {
    const owner = assertExists(getOwner(this), 'Could not find owner');
    return Boolean(owner.factoryFor(`helper:${name}`));
  }
}
