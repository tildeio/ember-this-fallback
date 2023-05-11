import { WalkerPath, builders as b, print } from '@glimmer/syntax';
import { beforeEach, describe, expect, test } from '@jest/globals';
import { type JSUtils } from 'babel-plugin-ember-template-compilation';
import {
  ambiguousStatementFallback,
  buildtimeExpressionFallback,
  helperOrExpressionFallback,
  mustacheNeedsFallback,
  needsFallback,
  wrapWithTryLookup,
  type AmbiguousMustacheExpression,
  type AmbiguousPathExpression,
} from '../helpers/fallback';
import ScopeStack from '../helpers/scope-stack';
import { classify } from '../helpers/string';

const IN_SCOPE = 'inScope';
const NOT_IN_SCOPE = 'notInScope';

const noParams = undefined;
const noHash = undefined;

const withHash = b.hash([b.pair('arg', b.boolean(true))]);
const withParams = [b.string('positional-param')];

const mockBindImport: JSUtils['bindImport'] = (
  _moduleSpecifier,
  _exportedName,
  _target,
  opts
) => opts?.nameHint ?? 'unknown';

describe('fallback helpers', () => {
  let scopeStack: ScopeStack;

  beforeEach(() => {
    scopeStack = new ScopeStack();
    scopeStack.push([IN_SCOPE]);
  });

  describe('PathExpression', () => {
    const fallbackCases = [
      b.path(NOT_IN_SCOPE),
      b.path(`${NOT_IN_SCOPE}.tail`),
    ];

    const noFallbackCases = [
      b.path(IN_SCOPE),
      b.path(`${IN_SCOPE}.tail`),
      b.path('array'), // global
      b.string('a-string'),
      b.boolean(true),
      b.sexpr(IN_SCOPE),
      b.sexpr(NOT_IN_SCOPE),
      b.number(1),
      b.undefined(),
      b.null(),
    ];

    describe('needsFallback', () => {
      for (const testCase of fallbackCases) {
        describe(print(testCase), () => {
          test('returns true', () => {
            expect(needsFallback(testCase, scopeStack)).toBe(true);
          });
        });
      }

      for (const testCase of noFallbackCases) {
        describe(print(testCase), () => {
          test('returns false', () => {
            expect(needsFallback(testCase, scopeStack)).toBe(false);
          });
        });
      }
    });

    describe('expressionFallback', () => {
      for (const testCase of fallbackCases) {
        describe(print(testCase), () => {
          test('has this-fallback', () => {
            expect(
              print(
                buildtimeExpressionFallback(testCase as AmbiguousPathExpression)
              )
            ).toEqual(`this.${print(testCase)}`);
          });
        });
      }
    });
  });

  describe('MustacheStatement', () => {
    const needsExpressionFallback = b.mustache(
      b.path(`${NOT_IN_SCOPE}.tail`),
      noParams,
      noHash
    );
    const needsAmbiguousFallback = b.mustache(
      b.path(NOT_IN_SCOPE),
      noParams,
      noHash
    );

    const fallbackCases = [needsExpressionFallback, needsAmbiguousFallback];

    const noFallbackCases = [
      b.mustache(b.path(NOT_IN_SCOPE), withParams, noHash),
      b.mustache(b.path(NOT_IN_SCOPE), noParams, withHash),
      b.mustache(b.path(NOT_IN_SCOPE), withParams, withHash),
      b.mustache(b.path(IN_SCOPE), noParams, noHash),
      b.mustache(b.path(IN_SCOPE), withParams, noHash),
      b.mustache(b.path(IN_SCOPE), noParams, withHash),
      b.mustache(b.path(IN_SCOPE), withParams, withHash),
      b.mustache(b.path(`${NOT_IN_SCOPE}.tail`), withParams, noHash),
      b.mustache(b.path(`${NOT_IN_SCOPE}.tail`), noParams, withHash),
      b.mustache(b.path(`${NOT_IN_SCOPE}.tail`), withParams, withHash),
      b.mustache(b.path(`${IN_SCOPE}.tail`), noParams, noHash),
      b.mustache(b.path(`${IN_SCOPE}.tail`), withParams, noHash),
      b.mustache(b.path(`${IN_SCOPE}.tail`), noParams, withHash),
      b.mustache(b.path(`${IN_SCOPE}.tail`), withParams, withHash),
      b.mustache(b.path('array')), // global
      b.mustache(b.string('a-string')),
      b.mustache(b.boolean(true)),
      b.mustache(b.sexpr(IN_SCOPE)),
      b.mustache(b.sexpr(NOT_IN_SCOPE)),
      b.mustache(b.number(1)),
      b.mustache(b.undefined()),
      b.mustache(b.null()),
    ];

    describe('mustacheNeedsFallback', () => {
      for (const testCase of fallbackCases) {
        describe(print(testCase), () => {
          test('returns true', () => {
            expect(mustacheNeedsFallback(testCase, scopeStack)).toBe(true);
          });
        });
      }

      for (const testCase of noFallbackCases) {
        describe(print(testCase), () => {
          test('returns false', () => {
            expect(mustacheNeedsFallback(testCase, scopeStack)).toBe(false);
          });
        });
      }
    });

    describe('expressionFallback', () => {
      describe(print(needsExpressionFallback), () => {
        test('has this-fallback', () => {
          expect(
            print(
              buildtimeExpressionFallback(
                needsExpressionFallback.path as AmbiguousPathExpression
              )
            )
          ).toEqual(`this.${NOT_IN_SCOPE}.tail`);
        });
      });
    });

    describe('helperOrExpressionFallback', () => {
      describe(print(needsAmbiguousFallback), () => {
        test('has this-fallback', () => {
          const path = new WalkerPath(needsAmbiguousFallback);
          expect(
            print(
              helperOrExpressionFallback(
                'maybeHelpers',
                needsAmbiguousFallback as AmbiguousMustacheExpression,
                false,
                { bindImport: mockBindImport, bindingTarget: path }
              )
            )
          ).toEqual(
            `(if maybeHelpers.${NOT_IN_SCOPE} (maybeHelpers.${NOT_IN_SCOPE}) (thisFallbackHelper this "${NOT_IN_SCOPE}" false))`
          );
        });
      });
    });

    describe('wrapWithTryLookup', () => {
      describe(print(needsAmbiguousFallback), () => {
        test('has this-fallback', () => {
          const path = new WalkerPath(needsAmbiguousFallback);
          expect(
            print(
              wrapWithTryLookup(
                needsAmbiguousFallback as AmbiguousMustacheExpression,
                new Set([NOT_IN_SCOPE]),
                'maybeHelpers',
                { bindImport: mockBindImport, bindingTarget: path }
              )
            )
          ).toEqual(
            `{{#let (hash ${NOT_IN_SCOPE}=(tryLookupHelper "${NOT_IN_SCOPE}")) as |maybeHelpers|}}{{${NOT_IN_SCOPE}}}{{/let}}`
          );
        });
      });
    });

    describe('ambiguousStatementFallback', () => {
      describe(print(needsAmbiguousFallback), () => {
        test('has this-fallback', () => {
          const path = new WalkerPath(needsAmbiguousFallback);
          expect(
            print(
              ambiguousStatementFallback(
                needsAmbiguousFallback as AmbiguousMustacheExpression,
                path,
                scopeStack,
                false,
                { bindImport: mockBindImport, bindingTarget: path }
              )
            )
          ).toEqual(
            `{{#if (isComponent "${NOT_IN_SCOPE}")}}<${classify(
              NOT_IN_SCOPE
            )} />{{else}}{{#let (hash ${NOT_IN_SCOPE}=(tryLookupHelper "${NOT_IN_SCOPE}")) as |maybeHelpers|}}{{(if maybeHelpers.${NOT_IN_SCOPE} (maybeHelpers.${NOT_IN_SCOPE}) (thisFallbackHelper this "${NOT_IN_SCOPE}" false))}}{{/let}}{{/if}}`
          );
        });
      });
    });
  });
});
