import { helper } from '@ember/component/helper';
import { deprecate } from '@ember/debug';

type Deprecation = Parameters<typeof deprecate>;

type Positional = [deprecationsJson: string];

interface DeprecationsHelperSignature {
  Args: {
    Positional: Positional;
  };
}

/** FIXME */
const deprecationsHelper = helper<DeprecationsHelperSignature>(
  ([deprecationsJson]) => {
    // FIXME: Assert instead of cast
    const deprecations = JSON.parse(deprecationsJson) as Deprecation[];
    for (const deprecation of deprecations) {
      deprecate(...deprecation);
    }
  }
);

export default deprecationsHelper;
