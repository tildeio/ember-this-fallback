import { render } from '@ember/test-helpers';
import { setupRenderingTest } from 'dummy/tests/helpers';
import { expectDeprecation } from 'dummy/tests/helpers/deprecations';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';

module('Integration | Plugin | SubExpression', function (hooks) {
  setupRenderingTest(hooks);

  module('with no params/hash', function () {
    test('does nothing when it is a param', async function (assert) {
      await render(hbs`<div {{global-modifier (global-helper)}} />`);
      assert.dom().hasText('global-modifier-result global-helper-result');
    });

    test('does nothing when it is an attribute', async function (assert) {
      await render(hbs`<GlobalComponent id={{(global-helper)}} />`);
      assert.dom().hasText('global-component-contents');
      assert
        .dom('[data-test-global-component]')
        .hasAttribute('id', 'global-helper-result');
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
            <div {{global-modifier (global-helper property)}} />
          `);
          assert
            .dom()
            .hasText(
              'global-modifier-result global-helper-result property-on-this'
            );
        });

        test('handles this-fallback with tail', async function (assert) {
          this.set('property', { tail: 'property-on-this' });
          await render<{ property: { tail: string } }>(hbs`
            {{!--
              @glint-expect-error:
              Unknown name 'property' (Glint knows better than to let us do this)
            --}}
            <div {{global-modifier (global-helper property.tail)}} />
          `);
          assert
            .dom()
            .hasText(
              'global-modifier-result global-helper-result property-on-this'
            );
        });
      });

      module('head in scope', function () {
        test('does nothing', async function (assert) {
          await render(hbs`
            {{#let "in-scope" as |inScope|}}
              <div {{global-modifier (global-helper inScope)}} />
            {{/let}}
          `);
          assert
            .dom()
            .hasText('global-modifier-result global-helper-result in-scope');
        });
      });
    });

    module('and a non-PathExpression', function () {
      test('does nothing', async function (assert) {
        await render(
          hbs`<div {{global-modifier (global-helper 'a-string')}} />`
        );
        assert
          .dom()
          .hasText('global-modifier-result global-helper-result a-string');
      });
    });
  });

  module('with hash', function () {
    module('and a PathExpression', function () {
      module('head not in scope', function () {
        test('handles this-fallback', async function (assert) {
          this.set('property', 'property-on-this');
          await expectDeprecation(
            async () => {
              await render<{ property: string }>(hbs`
            {{!--
              @glint-expect-error:
              Unknown name 'property' (Glint knows better than to let us do this)
            --}}
            <div {{global-modifier (global-helper arg=property)}} />
          `);
            },
            {
              message:
                /The `property` property path was used in the `\S*test.ts` template without using `this`. This fallback behavior has been deprecated, all properties must be looked up on `this` when used in the template: {{this.property}}/,
            }
          );

          assert
            .dom()
            .hasText(
              'global-modifier-result global-helper-result property-on-this'
            );
        });

        test('handles this-fallback with tail', async function (assert) {
          this.set('property', { tail: 'property-on-this' });
          await render<{ property: { tail: string } }>(hbs`
            {{!--
              @glint-expect-error:
              Unknown name 'property' (Glint knows better than to let us do this)
            --}}
            <div {{global-modifier (global-helper arg=property.tail)}} />
          `);
          assert
            .dom()
            .hasText(
              'global-modifier-result global-helper-result property-on-this'
            );
        });
      });

      module('head in scope', function () {
        test('does nothing', async function (assert) {
          await render(hbs`
            {{#let "in-scope" as |inScope|}}
              <div {{global-modifier (global-helper arg=inScope)}} />
            {{/let}}
          `);
          assert
            .dom()
            .hasText('global-modifier-result global-helper-result in-scope');
        });
      });
    });

    module('and a non-PathExpression', function () {
      test('does nothing', async function (assert) {
        await render(
          hbs`<div {{global-modifier (global-helper arg="a-string")}} />`
        );
        assert
          .dom()
          .hasText('global-modifier-result global-helper-result a-string');
      });
    });
  });
});
