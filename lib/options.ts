import { z } from 'zod';

interface Parent {
  options: Record<string, unknown>;
}

const EmberThisFallbackOptions = z
  .object({
    enableLogging: z.boolean().default(true),
  })
  .default({});

export type EmberThisFallbackOptions = z.infer<typeof EmberThisFallbackOptions>;

export function getOptions({ options }: Parent): EmberThisFallbackOptions {
  return EmberThisFallbackOptions.parse(options['ember-this-fallback']);
}
