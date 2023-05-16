import { assert } from '@ember/debug';

/** Asserts that the given value is not undefined. */
export function assertExists<T>(
  value: T | undefined,
  message = 'assertExists failed'
): T {
  assert(message, value !== undefined);
  return value;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}
