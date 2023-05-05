import Helper from '@ember/component/helper';
import { getOwner } from './get-owner';
import { assertExists } from './types/util';

type Positional = [name: string];

interface IsComponentSignature {
  Args: {
    Positional: Positional;
  };
  Return: boolean;
}

/** Checks if a component with the provided name exists. */
export default class IsComponent extends Helper<IsComponentSignature> {
  compute([name]: Positional): boolean {
    const owner = assertExists(getOwner(this), 'Could not find owner');
    return Boolean(owner.factoryFor(`component:${name}`));
  }
}
