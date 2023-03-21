import { assert } from '@ember/debug';

/** Asserts that the given value is not undefined. */
export function assertExists<T>(
  value: T | undefined,
  message = 'assertExists failed'
): T {
  assert(message, value !== undefined);
  return value;
}
