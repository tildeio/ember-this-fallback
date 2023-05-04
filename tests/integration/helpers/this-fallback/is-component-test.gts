import { render } from '@ember/test-helpers';
import { setupRenderingTest } from 'dummy/tests/helpers';
import { stringify } from 'dummy/tests/helpers/helpers';
import isComponent from 'ember-this-fallback/is-component';
import { module, test } from 'qunit';

module('Integration | Helper | isComponent', function (hooks) {
  setupRenderingTest(hooks);

  test('it is false if the name is invocable as a helper', async function (assert) {
    await render(<template>
      {{stringify (isComponent "global-helper")}}
    </template>);
    assert.dom().hasText('false');
  });

  test('it is true if the name is invocable as a component', async function (assert) {
    await render(<template>
      {{stringify (isComponent "global-component")}}
    </template>);
    assert.dom().hasText('true');
  });

  test('it is false if the name is not invocable as a helper or component', async function (assert) {
    await render(<template>{{stringify (isComponent "nope")}}</template>);
    assert.dom().hasText('false');
  });
});
