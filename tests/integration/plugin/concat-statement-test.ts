import { render } from '@ember/test-helpers';
import { setupRenderingTest } from 'dummy/tests/helpers';
import {
  localHelperNamed,
  localHelperPositional,
} from 'dummy/tests/helpers/helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';

module('Integration | Plugin | ConcatStatement', function (hooks) {
  setupRenderingTest(hooks);

  module('with no params/hash', function () {
    module('and a PathExpression with NO tail', function () {
      module('head is not in scope', function () {
        module('for an attr', function () {
          test('handles an invocable helper', async function (assert) {
            await render(hbs`<GlobalComponent id="{{global-helper}}" />`);
            assert.dom().hasText('global-component-contents');
            assert
              .dom('[data-test-global-component]')
              .hasAttribute('id', 'global-helper-result');
          });

          test('handles an invocable helper 2x', async function (assert) {
            await render(
              hbs`<GlobalComponent id="{{global-helper}}-{{global-helper}}" />`
            );
            assert.dom().hasText('global-component-contents');
            assert
              .dom('[data-test-global-component]')
              .hasAttribute('id', 'global-helper-result-global-helper-result');
          });

          test('handles this-fallback', async function (assert) {
            this.set('property', 'property-on-this');
            await render<{ property: string }>(hbs`
                {{!--
                  @glint-expect-error:
                  Unknown name 'property' (Glint knows better than to let us do this)
                --}}
                <GlobalComponent id="{{property}}" />
              `);
            assert.dom().hasText('global-component-contents');
            assert
              .dom('[data-test-global-component]')
              .hasAttribute('id', 'property-on-this');
          });

          test('handles this-fallback x2', async function (assert) {
            this.set('property', 'property-on-this');
            await render<{ property: string }>(hbs`
                {{!--
                  @glint-expect-error:
                  Unknown name 'property' (Glint knows better than to let us do this)
                --}}
                <GlobalComponent id="{{property}}-{{property}}" />
              `);
            assert.dom().hasText('global-component-contents');
            assert
              .dom('[data-test-global-component]')
              .hasAttribute('id', 'property-on-this-property-on-this');
          });

          test('does nothing to ThisHead PathExpression', async function (assert) {
            this.set('property', 'property-on-this');
            await render<{ property: string }>(hbs`
                <GlobalComponent id="{{this.property}}" />
              `);
            assert.dom().hasText('global-component-contents');
            assert
              .dom('[data-test-global-component]')
              .hasAttribute('id', 'property-on-this');
          });
        });

        module('for an @arg', function () {
          test('handles an invocable helper', async function (assert) {
            await render(hbs`
              <GlobalComponent @arg="{{global-helper}}" as |yielded|>
                {{yielded}}
              </GlobalComponent>
            `);
            assert
              .dom()
              .hasText('global-component-contents global-helper-result');
          });

          test('handles an invocable helper 2x', async function (assert) {
            await render(hbs`
              <GlobalComponent @arg="{{global-helper}} {{global-helper}}" as |yielded|>
                {{yielded}}
              </GlobalComponent>
            `);
            assert
              .dom()
              .hasText(
                'global-component-contents global-helper-result global-helper-result'
              );
          });

          test('handles this-fallback', async function (assert) {
            this.set('property', 'property-on-this');
            await render<{ property: string }>(hbs`
                {{!--
                  @glint-expect-error:
                  Unknown name 'property' (Glint knows better than to let us do this)
                --}}
                <GlobalComponent @arg="{{property}}" as |yielded|>
                  {{yielded}}
                </GlobalComponent>
              `);
            assert.dom().hasText('global-component-contents property-on-this');
          });

          test('handles this-fallback x2', async function (assert) {
            this.set('property', 'property-on-this');
            await render<{ property: string }>(hbs`
                {{!--
                  @glint-expect-error:
                  Unknown name 'property' (Glint knows better than to let us do this)
                --}}
                <GlobalComponent @arg="{{property}} {{property}}" as |yielded|>
                  {{yielded}}
                </GlobalComponent>
              `);
            assert
              .dom()
              .hasText(
                'global-component-contents property-on-this property-on-this'
              );
          });

          test('does nothing to ThisHead PathExpression', async function (assert) {
            this.set('property', 'property-on-this');
            await render<{ property: string }>(hbs`
              <GlobalComponent @arg="{{this.property}}" as |yielded|>
                {{yielded}}
              </GlobalComponent>
            `);
            assert.dom().hasText('global-component-contents property-on-this');
          });
        });
      });

      module('head is in scope', function () {
        module('for an attr', function () {
          test('does nothing', async function (assert) {
            await render(hbs`
                {{#let "in-scope" as |inScope|}}
                  <GlobalComponent id="{{inScope}}" />
                {{/let}}
              `);
            assert.dom().hasText('global-component-contents');
            assert
              .dom('[data-test-global-component]')
              .hasAttribute('id', 'in-scope');
          });
        });

        module('for an arg', function () {
          test('does nothing', async function (assert) {
            await render(hbs`
                {{#let "in-scope" as |inScope|}}
                  <GlobalComponent @arg="{{inScope}}" as |yielded|>
                    {{yielded}}
                  </GlobalComponent>
                {{/let}}
              `);
            assert.dom().hasText('global-component-contents in-scope');
          });
        });
      });
    });
  });

  module('with params', function () {
    module('and a PathExpression with no tail', function () {
      module('head is not in scope', function () {
        module('for an attr', function () {
          test('does nothing to an invocable helper', async function (assert) {
            await render(hbs`
                <GlobalComponent id="{{global-helper 'positional-arg'}}" />
              `);
            assert.dom().hasText('global-component-contents');
            assert
              .dom('[data-test-global-component]')
              .hasAttribute('id', 'global-helper-result positional-arg');
          });

          test('does nothing to ThisHead PathExpression', async function (assert) {
            this.set(
              'property', // NOTE: can't use function as helper because we support Ember
              localHelperPositional
            );
            await render<{
              property: typeof localHelperPositional;
            }>(hbs`
                <GlobalComponent id="{{this.property 'positional-arg'}}" />
              `);
            assert.dom().hasText('global-component-contents');
            assert
              .dom('[data-test-global-component]')
              .hasAttribute('id', 'local-helper-result positional-arg');
          });
        });

        module('for an @arg', function () {
          test('does nothing to an invocable helper', async function (assert) {
            await render(hbs`
                <GlobalComponent @arg="{{global-helper 'positional-arg'}}" as |yielded|>
                  {{yielded}}
                </GlobalComponent>
              `);
            assert
              .dom()
              .hasText(
                'global-component-contents global-helper-result positional-arg'
              );
          });

          test('does nothing to ThisHead PathExpression', async function (assert) {
            this.set(
              'property', // NOTE: can't use function as helper because we support Ember
              localHelperPositional
            );
            await render<{
              property: typeof localHelperPositional;
            }>(hbs`
                <GlobalComponent @arg="{{this.property 'positional-arg'}}" as |yielded|>
                  {{yielded}}
                </GlobalComponent>
              `);
            assert
              .dom()
              .hasText(
                'global-component-contents local-helper-result positional-arg'
              );
          });
        });
      });
    });
  });

  module('with hash', function () {
    module('and a PathExpression with no tail', function () {
      module('head is not in scope', function () {
        module('for an attr', function () {
          test('does nothing to an invocable helper', async function (assert) {
            await render(hbs`
                <GlobalComponent id="{{global-helper arg='named-arg'}}" />
              `);
            assert.dom().hasText('global-component-contents');
            assert
              .dom('[data-test-global-component]')
              .hasAttribute('id', 'global-helper-result named-arg');
          });

          test('does nothing to ThisHead PathExpression', async function (assert) {
            this.set('property', localHelperNamed);
            await render<{
              property: typeof localHelperNamed;
            }>(hbs`
                <GlobalComponent id="{{this.property arg='named-arg'}}" />
              `);
            assert.dom().hasText('global-component-contents');
            assert
              .dom('[data-test-global-component]')
              .hasAttribute('id', 'local-helper-result named-arg');
          });
        });

        module('for an @arg', function () {
          test('does nothing to an invocable helper', async function (assert) {
            await render(hbs`
                <GlobalComponent @arg="{{global-helper arg='named-arg'}}" as |yielded|>
                  {{yielded}}
                </GlobalComponent>
              `);
            assert
              .dom()
              .hasText(
                'global-component-contents global-helper-result named-arg'
              );
          });

          test('does nothing to ThisHead PathExpression', async function (assert) {
            this.set('property', localHelperNamed);
            await render<{
              property: typeof localHelperNamed;
            }>(hbs`
                <GlobalComponent @arg="{{this.property arg='named-arg'}}" as |yielded|>
                  {{yielded}}
                </GlobalComponent>
              `);
            assert
              .dom()
              .hasText(
                'global-component-contents local-helper-result named-arg'
              );
          });
        });
      });
    });
  });
});
