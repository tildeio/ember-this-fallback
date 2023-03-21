import { getOwner as deprecatedGetOwner } from '@ember/application';
import type Owner from '@ember/owner';

/**
 * Re-export of the `getOwner` export from `@ember/application`.
 * This export is deprecated as of
 * [Ember 4.10](https://github.com/emberjs/ember.js/releases/tag/v4.10.0)
 * but we need to support Ember versions prior to 4.10 also.
 */
export function getOwner(object: object): Owner | undefined {
  return deprecatedGetOwner(object);
}
