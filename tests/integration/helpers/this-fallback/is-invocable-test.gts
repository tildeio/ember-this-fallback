import { render } from '@ember/test-helpers';
import { setupRenderingTest } from 'dummy/tests/helpers';
import isInvocable from 'ember-this-fallback/is-invocable';
import { module, test } from 'qunit';

module('Integration | Helper | isInvocable', function (hooks) {
  setupRenderingTest(hooks);

  test('it is true if the name is invocable as a helper', async function (assert) {
    await render(<template>
      {{if (isInvocable "global-helper") "true" "false"}}
    </template>);
    assert.dom().hasText('true');
  });

  test('it is true if the name is invocable as a component', async function (assert) {
    await render(<template>
      {{if (isInvocable "global-component") "true" "false"}}
    </template>);
    assert.dom().hasText('true');
  });

  test('it is false if the name is not invocable as a helper or component', async function (assert) {
    await render(<template>
      {{if (isInvocable "nope") "true" "false"}}
    </template>);
    assert.dom().hasText('false');
  });
});
