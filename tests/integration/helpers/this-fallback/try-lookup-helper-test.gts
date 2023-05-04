import { render } from '@ember/test-helpers';
import { setupRenderingTest } from 'dummy/tests/helpers';
import { stringify } from 'dummy/tests/helpers/helpers';
import tryLookupHelper from 'ember-this-fallback/try-lookup-helper';
import { module, test } from 'qunit';

module('Integration | Helper | tryLookupHelper', function (hooks) {
  setupRenderingTest(hooks);

  test('it returns the helper with the given name if it exists', async function (assert) {
    await render(<template>
      {{#let (tryLookupHelper "global-helper") as |maybeHelper|}}
        {{! @glint-expect-error Glint doesn't know this one cool hack }}
        {{if maybeHelper (maybeHelper) (stringify maybeHelper)}}
      {{/let}}
    </template>);
    assert.dom().hasText('global-helper-result');
  });

  test('it returns undefined if a helper with given name does not exist', async function (assert) {
    await render(<template>
      {{#let (tryLookupHelper "glob-schmelper") as |maybeHelper|}}
        {{! @glint-expect-error Glint doesn't know this one cool hack }}
        {{if maybeHelper (maybeHelper) (stringify maybeHelper)}}
      {{/let}}
    </template>);
    assert.dom().hasText('undefined');
  });
});
