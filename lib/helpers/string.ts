import { camelCase, upperFirst } from 'lodash';

/**
 * Based on Rails' String#squish
 *
 * @param str String to squish
 * @returns Squished string
 */
export function squish(str: string): string {
  return (
    // This rule doesn't work properly with \u200B
    /* eslint-disable unicorn/prefer-string-replace-all */
    str
      .trim()
      .replace(/\u200B/g, '') // remove zero-width spaces
      .replace(/\s+/g, ' ') // squish multiple spaces into one
    /* eslint-enable unicorn/prefer-string-replace-all */
  );
}

export function classify(str: string): string {
  const parts = str.split('/');
  const classifiedParts = parts.map((p) => upperFirst(camelCase(p)));
  return classifiedParts.join('::');
}
