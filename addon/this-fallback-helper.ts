import { helper } from '@ember/component/helper';
import { deprecate } from '@ember/debug';
import { get } from '@ember/object';

type Deprecation = Parameters<typeof deprecate>;

type Positional<T, K extends keyof T> = [
  context: T,
  path: K,
  deprecationJson: string | false
];

/** FIXME */
const thisFallbackHelper = helper(
  <T, K extends keyof T>([context, path, deprecationJson]: Positional<
    T,
    K
  >) => {
    if (deprecationJson) {
      // FIXME: Assert instead of cast
      const deprecation = JSON.parse(deprecationJson) as Deprecation;
      deprecate(...deprecation);
    }
    return get(context, path);
  }
);

export default thisFallbackHelper;
