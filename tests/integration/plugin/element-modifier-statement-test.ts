import { render } from '@ember/test-helpers';
import { setupRenderingTest } from 'dummy/tests/helpers';
import {
  expectDeprecations,
  fallbackDeprecationExpectation,
} from 'dummy/tests/helpers/deprecations';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';

module('Integration | Plugin | ElementModifierStatement', function (hooks) {
  setupRenderingTest(hooks);

  module('with no params/hash', function () {
    test('does nothing', async function (assert) {
      await render(hbs`<div {{global-modifier}} />`);
      assert.dom().hasText('global-modifier-result');
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
            <div {{global-modifier property}} />
          `);
          assert.dom().hasText('global-modifier-result property-on-this');
          expectDeprecations(fallbackDeprecationExpectation('property'));
        });

        test('handles this-fallback with tail', async function (assert) {
          this.set('property', { tail: 'property-on-this' });
          await render<{ property: { tail: string } }>(hbs`
            {{!--
              @glint-expect-error:
              Unknown name 'property' (Glint knows better than to let us do this)
            --}}
            <div {{global-modifier property.tail}} />
          `);
          assert.dom().hasText('global-modifier-result property-on-this');
          expectDeprecations(fallbackDeprecationExpectation('property'));
        });
      });

      module('head in scope', function () {
        test('does nothing', async function (assert) {
          await render(hbs`
            {{#let "in-scope" as |inScope|}}
              <div {{global-modifier inScope}} />
            {{/let}}
          `);
          assert.dom().hasText('global-modifier-result in-scope');
        });
      });
    });

    module('and a non-PathExpression', function () {
      test('does nothing', async function (assert) {
        await render(hbs`<div {{global-modifier 'a-string'}} />`);
        assert.dom().hasText('global-modifier-result a-string');
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
            <div {{global-modifier arg=property}} />
          `);
          assert.dom().hasText('global-modifier-result property-on-this');
          expectDeprecations(fallbackDeprecationExpectation('property'));
        });

        test('handles this-fallback with tail', async function (assert) {
          this.set('property', { tail: 'property-on-this' });
          await render<{ property: { tail: string } }>(hbs`
            {{!--
              @glint-expect-error:
              Unknown name 'property' (Glint knows better than to let us do this)
            --}}
            <div {{global-modifier arg=property.tail}} />
          `);
          assert.dom().hasText('global-modifier-result property-on-this');
          expectDeprecations(fallbackDeprecationExpectation('property'));
        });
      });

      module('head in scope', function () {
        test('does nothing', async function (assert) {
          await render(hbs`
            {{#let "in-scope" as |inScope|}}
              <div {{global-modifier arg=inScope}} />
            {{/let}}
          `);
          assert.dom().hasText('global-modifier-result in-scope');
        });
      });
    });

    module('and a non-PathExpression', function () {
      test('does nothing', async function (assert) {
        await render(hbs`<div {{global-modifier arg="a-string"}} />`);
        assert.dom().hasText('global-modifier-result a-string');
      });
    });
  });
});
