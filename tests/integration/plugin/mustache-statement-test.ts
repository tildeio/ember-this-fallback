import { render } from '@ember/test-helpers';
import { setupRenderingTest } from 'dummy/tests/helpers';
import {
  expectDeprecations,
  fallbackDeprecationExpectation,
} from 'dummy/tests/helpers/deprecations';
import {
  localHelperNamed,
  localHelperPositional,
} from 'dummy/tests/helpers/helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';

module('Integration | Plugin | MustacheStatement', function (hooks) {
  setupRenderingTest(hooks);

  module('with no params/hash', function () {
    module('and a PathExpression with NO tail', function () {
      module('head is not in scope', function () {
        module('not within an AttrNode', function () {
          test('handles an invocable helper', async function (assert) {
            await render(hbs`{{global-helper}}`);
            assert.dom().hasText('global-helper-result');
          });

          test('handles an invocable component', async function (assert) {
            await render(hbs`{{global-component}}`);
            assert.dom().hasText('global-component-contents');
          });

          test('does nothing to an invocable modifier', async function (assert) {
            await render(hbs`<div {{global-modifier}} />`);
            assert.dom().hasText('global-modifier-result');
          });

          test('handles this-fallback', async function (assert) {
            this.set('property', 'property-on-this');
            await render<{ property: string }>(hbs`
              {{!--
                @glint-expect-error:
                Unknown name 'property' (Glint knows better than to let us do this)
              --}}
              {{property}}
            `);
            assert.dom().hasText('property-on-this');
          });

          test('does nothing to ThisHead PathExpression', async function (assert) {
            this.set('property', 'property-on-this');
            await render<{ property: string }>(hbs`{{this.property}}`);
            assert.dom().hasText('property-on-this');
          });
        });

        module('within an AttrNode', function () {
          module('for an attr', function () {
            test('handles an invocable helper', async function (assert) {
              await render(hbs`<GlobalComponent id={{global-helper}} />`);
              assert.dom().hasText('global-component-contents');
              assert
                .dom('[data-test-global-component]')
                .hasAttribute('id', 'global-helper-result');
            });

            test('handles this-fallback', async function (assert) {
              this.set('property', 'property-on-this');
              await render<{ property: string }>(hbs`
                {{!--
                  @glint-expect-error:
                  Unknown name 'property' (Glint knows better than to let us do this)
                --}}
                <GlobalComponent id={{property}} />
              `);
              assert.dom().hasText('global-component-contents');
              assert
                .dom('[data-test-global-component]')
                .hasAttribute('id', 'property-on-this');
            });

            test('does nothing to ThisHead PathExpression', async function (assert) {
              this.set('property', 'property-on-this');
              await render<{ property: string }>(hbs`
                <GlobalComponent id={{this.property}} />
              `);
              assert.dom().hasText('global-component-contents');
              assert
                .dom('[data-test-global-component]')
                .hasAttribute('id', 'property-on-this');
            });
          });

          module('for an @arg', function () {
            test('has this-fallback', async function (assert) {
              this.set('property', 'property-on-this');
              await render<{ property: string }>(hbs`
                {{!--
                  @glint-expect-error:
                  Unknown name 'property' (Glint knows better than to let us do this)
                --}}
                <GlobalComponent @arg={{property}} as |yielded|>
                  {{yielded}}
                </GlobalComponent>
              `);
              assert
                .dom()
                .hasText('global-component-contents property-on-this');
            });

            test('does nothing to ThisHead PathExpression', async function (assert) {
              this.set('property', 'property-on-this');
              await render<{ property: string }>(hbs`
                <GlobalComponent @arg={{this.property}} as |yielded|>
                  {{yielded}}
                </GlobalComponent>
              `);
              assert
                .dom()
                .hasText('global-component-contents property-on-this');
            });
          });
        });
      });

      module('head is in scope', function () {
        module('not within an AttrNode', function () {
          test('does nothing', async function (assert) {
            await render(hbs`
              {{#let "in-scope" as |inScope|}}
                {{inScope}}
              {{/let}}
            `);
            assert.dom().hasText('in-scope');
          });
        });

        module('within an AttrNode', function () {
          module('for an attr', function () {
            test('does nothing', async function (assert) {
              await render(hbs`
                {{#let "in-scope" as |inScope|}}
                  <GlobalComponent id={{inScope}} />
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
                  <GlobalComponent @arg={{inScope}} as |yielded|>
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

    module('and a PathExpression WITH a tail', function () {
      module('head is not in scope', function () {
        module('not within an AttrNode', function () {
          test('handles this-fallback', async function (assert) {
            this.set('property', { tail: 'property-on-this' });
            await render<{ property: { tail: string } }>(hbs`
              {{!--
                @glint-expect-error:
                Unknown name 'property' (Glint knows better than to let us do this)
              --}}
              {{property.tail}}
            `);
            assert.dom().hasText('property-on-this');
          });

          test('does nothing to ThisHead PathExpression', async function (assert) {
            this.set('property', { tail: 'property-on-this' });
            await render<{
              property: { tail: string };
            }>(hbs`{{this.property.tail}}`);
            assert.dom().hasText('property-on-this');
          });
        });

        module('within an AttrNode', function () {
          module('for an attr', function () {
            test('handles this-fallback', async function (assert) {
              this.set('property', { tail: 'property-on-this' });
              await render<{
                property: { tail: string };
              }>(hbs`
                {{!--
                  @glint-expect-error:
                  Unknown name 'property' (Glint knows better than to let us do this)
                --}}
                <GlobalComponent id={{property.tail}} />
              `);
              assert.dom().hasText('global-component-contents');
              assert
                .dom('[data-test-global-component]')
                .hasAttribute('id', 'property-on-this');
            });

            test('does nothing to ThisHead PathExpression', async function (assert) {
              this.set('property', { tail: 'property-on-this' });
              await render<{
                property: { tail: string };
              }>(hbs`<GlobalComponent id={{this.property.tail}} />`);
              assert.dom().hasText('global-component-contents');
              assert
                .dom('[data-test-global-component]')
                .hasAttribute('id', 'property-on-this');
            });
          });

          module('for an @arg', function () {
            test('does nothing to ThisHead PathExpression', async function (assert) {
              this.set('property', { tail: 'property-on-this' });
              await render<{
                property: { tail: string };
              }>(hbs`
                <GlobalComponent @arg={{this.property.tail}} as |yielded|>
                  {{yielded}}
                </GlobalComponent>
              `);
              assert
                .dom()
                .hasText('global-component-contents property-on-this');
            });
          });
        });
      });

      module('head is in scope', function () {
        module('not within an AttrNode', function () {
          test('does nothing', async function (assert) {
            await render(hbs`
              {{#let (hash tail="in-scope") as |inScope|}}
                {{inScope.tail}}
              {{/let}}
            `);
            assert.dom().hasText('in-scope');
          });
        });

        module('within an AttrNode', function () {
          module('for an attr', function () {
            test('does nothing', async function (assert) {
              await render(hbs`
                {{#let (hash tail="in-scope") as |inScope|}}
                  <GlobalComponent id={{inScope.tail}} />
                {{/let}}
              `);
              assert.dom().hasText('global-component-contents');
              assert
                .dom('[data-test-global-component]')
                .hasAttribute('id', 'in-scope');
            });
          });

          module('for an @arg', function () {
            test('does nothing', async function (assert) {
              await render(hbs`
                {{#let (hash tail="in-scope") as |inScope|}}
                  <GlobalComponent @arg={{inScope.tail}} as |yielded|>
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

    module('and a non-PathExpression', function () {
      module('not within an AttrNode', function () {
        test('does nothing', async function (assert) {
          await render(hbs`{{'a-string'}}`);
          assert.dom().hasText('a-string');
        });
      });

      module('within an AttrNode', function () {
        module('for an attr', function () {
          test('does nothing', async function (assert) {
            await render(hbs`
              <GlobalComponent id={{'a-string'}} />
            `);
            assert.dom().hasText('global-component-contents');
            assert
              .dom('[data-test-global-component]')
              .hasAttribute('id', 'a-string');
          });
        });

        module('for an @arg', function () {
          test('does nothing', async function (assert) {
            await render(hbs`
              <GlobalComponent @arg={{'a-string'}} as |yielded|>
                {{yielded}}
              </GlobalComponent>
            `);
            assert.dom().hasText('global-component-contents a-string');
          });
        });
      });
    });
  });

  module('with params', function () {
    module('and a PathExpression with no tail', function () {
      module('head is not in scope', function () {
        module('not within an AttrNode', function () {
          test('does nothing to an invocable helper', async function (assert) {
            await render(hbs`{{global-helper 'positional-arg'}}`);
            assert.dom().hasText('global-helper-result positional-arg');
          });

          test('does nothing to ThisHead PathExpression', async function (assert) {
            this.set('property', localHelperPositional);
            await render<{
              property: typeof localHelperPositional;
            }>(hbs`{{this.property 'positional-arg'}}`);
            assert.dom().hasText('local-helper-result positional-arg');
          });

          test('handles this-fallback', async function (assert) {
            this.set('property', 'property-on-this');
            await render<{ property: string }>(hbs`
              {{!--
                @glint-expect-error:
                Unknown name 'property' (Glint knows better than to let us do this)
              --}}
              {{global-helper property}}
            `);
            assert.dom().hasText('global-helper-result property-on-this');
            expectDeprecations(fallbackDeprecationExpectation('property'));
          });
        });

        module('within an AttrNode', function () {
          module('for an attr', function () {
            test('does nothing to an invocable helper', async function (assert) {
              await render(hbs`
                <GlobalComponent id={{global-helper 'positional-arg'}} />
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
                <GlobalComponent id={{this.property 'positional-arg'}} />
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
                <GlobalComponent @arg={{global-helper 'positional-arg'}} as |yielded|>
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
                <GlobalComponent @arg={{this.property 'positional-arg'}} as |yielded|>
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

      module('head is in scope', function () {
        module('not within an AttrNode', function () {
          test('does nothing', async function (assert) {
            this.set('property', 'property-on-this');
            await render(hbs`
              {{#let "in-scope" as |inScope|}}
                {{global-helper inScope}}
              {{/let}}
            `);
            assert.dom().hasText('global-helper-result in-scope');
          });
        });
      });
    });
  });

  module('with hash', function () {
    module('and a PathExpression with no tail', function () {
      module('head is not in scope', function () {
        module('not within an AttrNode', function () {
          test('does nothing to an invocable helper', async function (assert) {
            await render(hbs`
              {{global-helper arg='named-arg'}}
            `);
            assert.dom().hasText('global-helper-result named-arg');
          });

          test('does nothing to an invocable component', async function (assert) {
            await render(hbs`
              {{#global-component arg='named-arg' as |yielded|}}
                {{yielded}}
              {{/global-component}}
            `);
            assert.dom().hasText('global-component-contents named-arg');
          });

          test('does nothing to ThisHead PathExpression', async function (assert) {
            this.set('property', localHelperNamed);
            await render<{
              property: typeof localHelperNamed;
            }>(hbs`{{this.property arg='named-arg'}}`);
            assert.dom().hasText('local-helper-result named-arg');
          });

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
        });

        module('within an AttrNode', function () {
          module('for an attr', function () {
            test('does nothing to an invocable helper', async function (assert) {
              await render(hbs`
                <GlobalComponent id={{global-helper arg='named-arg'}} />
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
                <GlobalComponent id={{this.property arg='named-arg'}} />
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
                <GlobalComponent @arg={{global-helper arg='named-arg'}} as |yielded|>
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
                <GlobalComponent @arg={{this.property arg='named-arg'}} as |yielded|>
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

      module('head is in scope', function () {
        module('not within an AttrNode', function () {
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
    });
  });
});
