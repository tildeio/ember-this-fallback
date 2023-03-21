import { render } from '@ember/test-helpers';
import { setupRenderingTest } from 'dummy/tests/helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';

module('Integration | Helper | this-fallback/is-helper', function (hooks) {
  setupRenderingTest(hooks);

  test('it is true if the name is invocable as a helper', async function (assert) {
    await render(
      hbs`{{if (this-fallback/is-helper "global-helper") "true" "false"}}`
    );
    assert.dom().hasText('true');
  });

  test('it is false if the name is invocable as a component', async function (assert) {
    await render(
      hbs`{{if (this-fallback/is-helper "global-component") "true" "false"}}`
    );
    assert.dom().hasText('false');
  });

  test('it is false if the name is not invocable as a helper', async function (assert) {
    await render(hbs`{{if (this-fallback/is-helper "nope") "true" "false"}}`);
    assert.dom().hasText('false');
  });
});
