import { render } from '@ember/test-helpers';
import { setupRenderingTest } from 'dummy/tests/helpers';
import {
  expectDeprecations,
  fallbackDeprecationExpectation,
} from 'dummy/tests/helpers/deprecations';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';

module('Integration | Plugin | BlockStatement', function (hooks) {
  setupRenderingTest(hooks);

  module('with no params/hash', function () {
    test('does nothing', async function (assert) {
      await render(hbs`{{#global-component}}{{/global-component}}`);
      assert.dom().hasText('global-component-contents');
    });
  });

  module('with params', function () {
    module('and a PathExpression', function () {
      module('head not in scope', function () {
        test('handles this-fallback', async function (assert) {
          this.set('property', 'property-on-this');
          await render<{ property: string }>(hbs`
            {{!--
              @glint-expect-error:
              Unknown name 'property' (Glint knows better than to let us do this)
            --}}
            {{#let property as |yielded|}}
              {{yielded}}
            {{/let}}
          `);
          assert.dom().hasText('property-on-this');
          expectDeprecations(fallbackDeprecationExpectation('property'));
        });

        test('handles this-fallback with tail', async function (assert) {
          this.set('property', { tail: 'property-on-this' });
          await render<{ property: { tail: string } }>(hbs`
            {{!--
              @glint-expect-error:
              Unknown name 'property' (Glint knows better than to let us do this)
            --}}
            {{#let property.tail as |yielded|}}
              {{yielded}}
            {{/let}}
          `);
          assert.dom().hasText('property-on-this');
          expectDeprecations(fallbackDeprecationExpectation('property'));
        });
      });

      module('head in scope', function () {
        test('does nothing', async function (assert) {
          await render(hbs`
            {{#let "in-scope" as |inScope|}}
              {{#let inScope as |yielded|}}{{yielded}}{{/let}}
            {{/let}}
          `);
          assert.dom().hasText('in-scope');
        });
      });
    });

    module('and a non-PathExpression', function () {
      test('does nothing', async function (assert) {
        await render(hbs`
          {{#let 'a-string' as |yielded|}}{{yielded}}{{/let}}
        `);
        assert.dom().hasText('a-string');
      });
    });
  });

  module('with hash', function () {
    module('and a PathExpression', function () {
      module('head not in scope', function () {
        test('handles this-fallback', async function (assert) {
          this.set('property', 'property-on-this');
          await render<{ property: string }>(hbs`
            {{!--
              @glint-expect-error:
              Unknown name 'property' (Glint knows better than to let us do this)
            --}}
            {{#global-component arg=property as |yielded|}}
              {{yielded}}
            {{/global-component}}
          `);
          assert.dom().hasText('global-component-contents property-on-this');
          expectDeprecations(fallbackDeprecationExpectation('property'));
        });

        test('handles this-fallback with tail', async function (assert) {
          this.set('property', { tail: 'property-on-this' });
          await render<{ property: { tail: string } }>(hbs`
            {{!--
              @glint-expect-error:
              Unknown name 'property' (Glint knows better than to let us do this)
            --}}
            {{#global-component arg=property.tail as |yielded|}}
              {{yielded}}
            {{/global-component}}
          `);
          assert.dom().hasText('global-component-contents property-on-this');
          expectDeprecations(fallbackDeprecationExpectation('property'));
        });
      });

      module('head in scope', function () {
        test('does nothing', async function (assert) {
          await render(hbs`
            {{#let "in-scope" as |inScope|}}
              {{#global-component arg=inScope as |yielded|}}
                {{yielded}}
              {{/global-component}}
            {{/let}}
          `);
          assert.dom().hasText('global-component-contents in-scope');
        });
      });
    });

    module('and a non-PathExpression', function () {
      test('does nothing', async function (assert) {
        await render(hbs`
          {{#global-component arg="a-string" as |yielded|}}
            {{yielded}}
          {{/global-component}}
        `);
        assert.dom().hasText('global-component-contents a-string');
      });
    });
  });
});
