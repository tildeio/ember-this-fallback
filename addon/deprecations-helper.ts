import { helper } from '@ember/component/helper';
import { deprecate } from '@ember/debug';
import { assertIsDeprecations } from 'ember-this-fallback/types/deprecations';

type Positional = [
  /**
   * A JSON stringified array of arrays of @ember/debug `deprecate` params.
   */
  deprecationsJson: string
];

interface DeprecationsHelperSignature {
  Args: {
    Positional: Positional;
  };
}

/**
 * Calls @ember/debug `deprecate` for each provided set of `deprecate` params.
 */
const deprecationsHelper = helper<DeprecationsHelperSignature>(
  ([deprecationsJson]) => {
    const deprecations = assertIsDeprecations(JSON.parse(deprecationsJson));
    for (const deprecation of deprecations) {
      deprecate(...deprecation);
    }
  }
);

export default deprecationsHelper;
