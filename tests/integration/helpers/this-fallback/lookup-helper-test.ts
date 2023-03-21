import { render } from '@ember/test-helpers';
import { setupRenderingTest } from 'dummy/tests/helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';

module('Integration | Helper | this-fallback/lookup-helper', function (hooks) {
  setupRenderingTest(hooks);

  test('it returns the helper with the same name', async function (assert) {
    await render(hbs`{{helper (this-fallback/lookup-helper "global-helper")}}`);
    assert.dom().hasText('global-helper-result');
  });
});
