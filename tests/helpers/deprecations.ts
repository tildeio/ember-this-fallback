import { getDeprecations, type DeprecationFailure } from '@ember/test-helpers';

interface DeprecationExpectation {
  message: RegExp | string;
  options?: Partial<DeprecationFailure['options']>;
}

export function setupDeprecationHelpers(hooks: NestedHooks): void {
  const assert = new DeprecationAssert();

  hooks.beforeEach(function () {
    assert.setup();
  });

  hooks.afterEach(function () {
    assert.teardown();
  });
}

export let expectDeprecations: DeprecationAssert['expectDeprecations'] = () => {
  throw new Error(
    'DeprecationAssert: You must call `setupDeprecationHelpers` before calling `expectDeprecations`.'
  );
};

class DeprecationAssert {
  private didAssertion = false;

  setup(): void {
    expectDeprecations = this.expectDeprecations.bind(this);
  }

  teardown(): void {
    this.defaultAssert();
    this.didAssertion = false;
  }

  private defaultAssert(): void {
    if (!this.didAssertion) {
      this.expectDeprecations();
    }
  }

  private expectDeprecations(...expected: DeprecationExpectation[]): void {
    const { assert } = QUnit;
    const actual = getDeprecations();

    if (expected.length === actual.length) {
      for (const [
        index,
        { message: expectedMessage, options: expectedOptions },
      ] of expected.entries()) {
        const { message: actualMessage, options: actualOptions } = actual[
          index
        ] ?? {
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
      assert.pushResult({
        result: false,
        actual: JSON.stringify(actual),
        expected: JSON.stringify(expected),
        message: 'Deprecations mismatch',
      });
    }

    this.didAssertion = true;
  }
}

export function fallbackDeprecationExpectation(
  headName: string
): DeprecationExpectation {
  return {
    message: new RegExp(
      `The \`${headName}\` property path was used in the \`\\S*test\\.ts\` template without using \`this\`\\. This fallback behavior has been deprecated, all properties must be looked up on \`this\` when used in the template: {{this\\.${headName}}}`
    ),
    options: { id: 'this-property-fallback' },
  };
}
