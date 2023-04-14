import '@glint/environment-ember-loose';
import { type HelperLike } from '@glint/template';
import 'ember-source/types';
import 'ember-source/types/preview';

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    'page-title': HelperLike<{
      Args: {
        Positional: [title: string];
      };
      Return: '';
    }>;
  }
}
