import { helper } from '@ember/component/helper';
import { deprecate } from '@ember/debug';
import { get } from '@ember/object';
import { assertIsDeprecation } from 'ember-this-fallback/types/deprecations';

type Positional<T, K extends keyof T> = [
  context: T,
  path: K,
  deprecationJson: string | false
];

/**
 * Looks up the given `path` on the given `context` and returns it.
 *
 * If `deprecationJson` is JSON stringified `deprecate` params, `deprecate`
 * will be called with those params.
 */
const thisFallbackHelper = helper(
  <T, K extends keyof T>([context, path, deprecationJson]: Positional<
    T,
    K
  >) => {
    if (deprecationJson) {
      const deprecation = assertIsDeprecation(JSON.parse(deprecationJson));
      deprecate(...deprecation);
    }
    return get(context, path);
  }
);

export default thisFallbackHelper;
