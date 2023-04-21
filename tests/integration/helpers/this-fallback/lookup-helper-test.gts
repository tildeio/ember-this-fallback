import { render } from '@ember/test-helpers';
import { setupRenderingTest } from 'dummy/tests/helpers';
import lookupHelper from 'ember-this-fallback/lookup-helper';
import { module, test } from 'qunit';

module('Integration | Helper | lookupHelper', function (hooks) {
  setupRenderingTest(hooks);

  test('it returns the helper with the same name', async function (assert) {
    await render(<template>
      {{helper (lookupHelper "global-helper")}}
    </template>);
    assert.dom().hasText('global-helper-result');
  });
});
