// Based loosely on https://github.com/emberjs/ember.js/blob/4f8ae0548b3b3fc869c0088a861024995b66f1a8/packages/internal-test-helpers/lib/ember-dev/deprecation.ts
// but using registerDeprecationHandler instead of ember internal-test-helpers debug stubbing shenanigans

import { registerDeprecationHandler } from '@ember/debug';
import { type DeprecationOptions } from '@ember/test-helpers/-internal/deprecations';

export type Message = string | RegExp;

export function setupDeprecationHelpers(hooks: NestedHooks): void {
  const assertion = new DeprecationAssert();

  hooks.beforeEach(function () {
    assertion.setup();
  });

  hooks.afterEach(function () {
    assertion.assert();
  });
}

function unimplemented(functionName: string): () => never {
  return () => {
    throw new Error(
      `DeprecationAssert: To use \`${functionName}\` in a test you must call \`setupDeprecationHelpers\` first`
    );
  };
}

export let expectDeprecation: DeprecationAssert['expectDeprecation'] =
  unimplemented('expectDeprecation');

class DeprecationAssert {
  private expectedDeprecations: Array<{
    message: Message;
    options?: Partial<DeprecationOptions>;
  }> = [];

  private actualDeprecations: Array<{
    message: string;
    options: DeprecationOptions | undefined;
  }> = [];

  setup(): void {
    expectDeprecation = this.expectDeprecation.bind(this);
    registerDeprecationHandler((message, options, next) => {
      this.actualDeprecations.push({ message, options });
      next(message, options); // FIXME: Should we still log?
    });
  }

  assert(): void {
    const { assert } = QUnit;
    const { actualDeprecations, expectedDeprecations } = this;

    if (expectedDeprecations.length === actualDeprecations.length) {
      for (const [
        index,
        { message: expectedMessage, options: expectedOptions },
      ] of expectedDeprecations.entries()) {
        const { message: actualMessage, options: actualOptions } =
          actualDeprecations[index] ?? {
            message: undefined,
            options: undefined,
          };
        if (typeof expectedMessage === 'string') {
          assert.strictEqual(
            actualMessage,
            expectedMessage,
            'Deprecation message matches expectation'
          );
        } else {
          assert.pushResult({
            result: !!actualMessage && expectedMessage.test(actualMessage),
            actual: actualMessage ?? '',
            expected: expectedMessage.source,
            message: `Deprecation message passes test /${expectedMessage.source}/`,
          });
        }

        if (expectedOptions) {
          assert.propContains(
            actualOptions,
            expectedOptions,
            'Deprecation options match expectation'
          );
        }
      }
    } else {
      assert.deepEqual(
        actualDeprecations,
        expectedDeprecations,
        'Deprecations mismatch'
      );
    }

    this.restore();
  }

  private restore(): void {
    expectDeprecation = unimplemented('expectDeprecation');
    this.expectedDeprecations = [];
    this.actualDeprecations = [];
  }

  private async expectDeprecation(
    func: (() => Promise<void>) | (() => void),
    ...deprecations: Array<{
      message: Message;
      options?: Partial<DeprecationOptions>;
    }>
  ): Promise<void> {
    this.expectedDeprecations.push(...deprecations);
    await func();
    this.assert();
  }
}

export function fallbackDeprecationExpectation(headName: string): {
  message: RegExp;
  options: Partial<DeprecationOptions>;
} {
  return {
    message: new RegExp(
      `The \`${headName}\` property path was used in the \`\\S*test.ts\` template without using \`this\`. This fallback behavior has been deprecated, all properties must be looked up on \`this\` when used in the template: {{this.${headName}}}`
    ),
    options: { id: 'this-property-fallback' },
  };
}
