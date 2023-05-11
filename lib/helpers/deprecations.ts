import { type deprecate } from '@ember/debug';
import assert from '../types/assert';

export type Deprecation = Parameters<typeof deprecate>;

export type DeprecationOptions = Deprecation[2];

const CURRENT_DEPRECATIONS = [
  {
    id: 'this-property-fallback' as const,
    until: 'n/a',
    for: 'ember-this-fallback',
    url: 'https://deprecations.emberjs.com/v3.x#toc_this-property-fallback',
    since: {
      available: '0.2.0',
    },
  },
] satisfies readonly DeprecationOptions[];

type DeprecationId = (typeof CURRENT_DEPRECATIONS)[number]['id'];

const DEPRECATION_OPTIONS_MAP = new Map(
  CURRENT_DEPRECATIONS.map((options) => [options.id, options])
);

export function deprecationOptionsFor(id: DeprecationId): DeprecationOptions {
  const options = DEPRECATION_OPTIONS_MAP.get(id);
  assert(`expected to find DeprecationOptions for id=${id}`, options);
  return options;
}
