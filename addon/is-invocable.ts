import Helper from '@ember/component/helper';
import { getOwner } from './get-owner';
import { assertExists } from './types/util';

type Positional = [name: string];

interface IsInvocableSignature {
  Args: {
    Positional: Positional;
  };
  Return: boolean;
}

/** Checks if a component or helper with the provided name exists. */
export default class IsInvocable extends Helper<IsInvocableSignature> {
  compute([name]: Positional): boolean {
    const owner = assertExists(getOwner(this), 'Could not find owner');
    return (
      Boolean(owner.factoryFor(`component:${name}`)) ||
      Boolean(owner.factoryFor(`helper:${name}`))
    );
  }
}
