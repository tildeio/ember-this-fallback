import { assert, type deprecate } from '@ember/debug';
import { isRecord, isString } from 'ember-this-fallback/types/util';

type Deprecation = Parameters<typeof deprecate>;

function isDeprecation(value: unknown): value is Deprecation {
  if (Array.isArray(value) && value.length === 3) {
    const [message, _test, options] = value as Deprecation;
    return isString(message) && isRecord(options) && isString(options.id);
  } else {
    return false;
  }
}

export function assertIsDeprecation(
  value: unknown
): asserts value is Deprecation {
  assert(
    'value was expected to be a `deprecate` params array',
    isDeprecation(value)
  );
}

export function assertIsDeprecations(
  value: unknown
): asserts value is Deprecation[] {
  assert(
    'value was expected to be am array of `deprecate` params arrays',
    Array.isArray(value) && value.every((element) => isDeprecation(element))
  );
}
