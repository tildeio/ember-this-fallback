import '@glint/environment-ember-loose';
import { type ContentValue, type HelperLike } from '@glint/template';
import 'ember-source/types';
import 'ember-source/types/preview';

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    // TODO: can probably remove this after glint 1.0
    helper: HelperLike<{
      Args: {
        Positional: [helper: string | HelperLike];
      };
      Return: ContentValue;
    }>;

    'page-title': HelperLike<{
      Args: {
        Positional: [title: string];
      };
      Return: '';
    }>;
  }
}
