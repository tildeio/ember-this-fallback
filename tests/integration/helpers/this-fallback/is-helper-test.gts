import { render } from '@ember/test-helpers';
import { setupRenderingTest } from 'dummy/tests/helpers';
import isHelper from 'ember-this-fallback/is-helper';
import { module, test } from 'qunit';

module('Integration | Helper | isHelper', function (hooks) {
  setupRenderingTest(hooks);

  test('it is true if the name is invocable as a helper', async function (assert) {
    await render(<template>
      {{if (isHelper "global-helper") "true" "false"}}
    </template>);
    assert.dom().hasText('true');
  });

  test('it is false if the name is invocable as a component', async function (assert) {
    await render(<template>
      {{if (isHelper "global-component") "true" "false"}}
    </template>);
    assert.dom().hasText('false');
  });

  test('it is false if the name is not invocable as a helper', async function (assert) {
    await render(<template>{{if (isHelper "nope") "true" "false"}}</template>);
    assert.dom().hasText('false');
  });
});
