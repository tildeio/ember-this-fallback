import { render } from '@ember/test-helpers';
import { setupRenderingTest } from 'dummy/tests/helpers';
import {
  expectDeprecations,
  fallbackDeprecationExpectation,
} from 'dummy/tests/helpers/deprecations';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';

module('Integration | Plugin | scope', function (hooks) {
  setupRenderingTest(hooks);

  test('it keeps track of local scope in Blocks', async function (assert) {
    this.set('property', 'property-on-this');
    await render<{ property: string }>(hbs`
      {{!--
        @glint-expect-error:
        Unknown name 'property' (Glint knows better than to let us do this)
      --}}
      {{property}}
      {{#let 'in-scope' as |property|}}
        {{property}}
        {{#let 'in-scope-2' as |property|}}
          {{property}}
        {{/let}}
        {{property}}
      {{/let}}
      {{!--
        @glint-expect-error:
        Unknown name 'property' (Glint knows better than to let us do this)
      --}}
      {{property}}
    `);
    assert
      .dom()
      .hasText(
        'property-on-this in-scope in-scope-2 in-scope property-on-this'
      );
    expectDeprecations(
      fallbackDeprecationExpectation('property'),
      fallbackDeprecationExpectation('property')
    );
  });

  test('it keeps track of local scope in Element Nodes', async function (assert) {
    this.set('property', 'property-on-this');
    await render<{ property: string }>(hbs`
      {{!--
        @glint-expect-error:
        Unknown name 'property' (Glint knows better than to let us do this)
      --}}
      {{property}}
      <GlobalComponent @arg='in-scope' as |property|>
        {{property}}
        <GlobalComponent @arg='in-scope-2' as |property|>
          {{property}}
        </GlobalComponent>
        {{property}}
      </GlobalComponent>
      {{!--
        @glint-expect-error:
        Unknown name 'property' (Glint knows better than to let us do this)
      --}}
      {{property}}
    `);
    assert
      .dom()
      .hasText(
        'property-on-this global-component-contents in-scope global-component-contents in-scope-2 in-scope property-on-this'
      );
    expectDeprecations(
      fallbackDeprecationExpectation('property'),
      fallbackDeprecationExpectation('property')
    );
  });

  test('it keeps track of local scope in mixed Block and Element Nodes', async function (assert) {
    this.set('property', 'property-on-this');
    await render<{ property: string }>(hbs`
      {{!--
        @glint-expect-error:
        Unknown name 'property' (Glint knows better than to let us do this)
      --}}
      {{property}}
      {{#let 'in-scope' as |property|}}
        {{property}}
        <GlobalComponent @arg='in-scope-2' as |property|>
          {{property}}
        </GlobalComponent>
        {{property}}
      {{/let}}
      {{!--
        @glint-expect-error:
        Unknown name 'property' (Glint knows better than to let us do this)
      --}}
      {{property}}
    `);
    assert
      .dom()
      .hasText(
        'property-on-this in-scope global-component-contents in-scope-2 in-scope property-on-this'
      );
    expectDeprecations(
      fallbackDeprecationExpectation('property'),
      fallbackDeprecationExpectation('property')
    );
  });
});
