# ember-this-fallback

Polyfills [Ember's deprecated Property Fallback Lookup feature](https://deprecations.emberjs.com/v3.x/#toc_this-property-fallback) to allow apps to continue using it without blocking Ember 4.0+ upgrades.

## Compatibility

- Ember.js v3.28.11 or above
- Ember CLI v3.28 or above
- Node.js v16 or above
- ember-cli-htmlbars 6.2.0 or above

## Installation

```shell
ember install ember-this-fallback
```

## How It Works

The addon registers an [ember-cli-htmlbars plugin](https://github.com/ember-cli/ember-cli-htmlbars#adding-custom-plugins) that traverses the nodes in your Ember templates and transforms them using the following logic:

For each `PathExpression` with a `VarHead` that is NOT in the local template scope:

- If it is within `node.params` or a `node.hash` value for a `CallNode` (`MustacheStatement | BlockStatement | ElementModifierStatement | SubExpression`):

  Prefix the `head` with `this`, making it a `ThisHead` ("expression fallback").

  For example:

  ```hbs
  {{! before }}
  {{global-helper property}}

  {{! after }}
  {{global-helper this.property}}
  ```

- If is the `path` for a `MustacheStatement` with NO params or hash:

  - If there is a `tail`:

    Prefix the `head` with `this`, making it a `ThisHead` ("expression fallback").

    ```hbs
    {{! before }}
    {{property.value}}

    {{! after }}
    {{this.property.value}}
    ```

  - If there is NO `tail`:

    - If the `MustacheStatement` is the child of an `AttrNode`

      - And the `AttrNode` represents a component argument (the name starts with `'@'`):

        Prefix the `head` with `this`, making it a `ThisHead` ("expression fallback"), as shown above.

      - And the `AttrNode` represents an attribute (the name does not start with `'@'`):

        Wrap the invocation with the `tryLookupHelper` helper to determine if it is a helper at runtime and fall back to the `this` property if not ("ambiguous attribute fallback").

        ```hbs
        {{! before }}
        <Parent id={{property}} />

        {{! after }}
        {{#let (hash property=(tryLookupHelper "property")) as |maybeHelpers|}}
          <Parent
            id={{(if
              maybeHelpers.property (maybeHelpers.property) this.property
            )}}
          />
        {{/let}}
        ```

    - Otherwise:

      Wrap the invocation with the `isComponent` helper to determine if it is a component at runtime and invoke it as a component if so. If not, wrap the invocation with the `tryLookupHelper` helper to determine if it is a helper ad runtime and fall back to the `this` property if not ("ambiguous statement fallback").

      ```hbs
      {{! before }}
      {{property}}

      {{! after }}
      {{#if (isComponent "property")}}
        <Property />
      {{else}}
        {{#let (hash property=(tryLookupHelper "property")) as |maybeHelpers|}}
          {{(if maybeHelpers.property (maybeHelpers.property) this.property)}}
        {{/let}}
      {{/if}}
      ```

### Caveats

#### Runtime implications

The `isComponent` and `tryLookupHelper` helpers have runtime implications that may have performance impacts. Thus, we recommend relying on this addon only temporarily to unblock 4.0+ upgrades while continuing to migrate away from reliance on the Property Fallback Lookup feature.

#### Embroider compatibility

In the "ambiguous attribute fallback" and "ambiguous statement fallback" cases shown above, we fall back to dynamic resolution at runtime to determine if the contents of the mustache statement point to a helper, a component, or a property on `this`. This technique is fundamentally incompatible with [Embroider](https://github.com/embroider-build/embroider) "optimized" mode, specifically the `staticHelpers` and `staticComponents` configs (and thus, `splitAtRoutes`), which requires that helpers are resolvable at build-time.

Thus, in these cases, we log a warning to `ember-this-fallback-plugin.log`. If you wish to use Embroider's "optimized" mode, we recommend manually updating the code in these cases to either:

```hbs
{{! For a known property on `this`. }}
{{this.property}}
```

or

```hbs
{{! For a known global helper. }}
{{(property)}}
```

or

```hbs
{{! For a known global component. }}
<Property />
```

In the future, we could resolve this incompatibility if we had access to Embroider's static resolution.

## Deprecations

Because the intent of this library is to allow users to upgrade to Ember 4.0+ while they still in the process of resolving this-property-fallback deprecations, this library includes the [`this-property-fallback` deprecation from Ember 3.x](https://deprecations.emberjs.com/v3.x#toc_this-property-fallback). You can follow the instructions [here](https://guides.emberjs.com/release/configuring-ember/handling-deprecations/) for handling these deprecations.

## Configuration

You can configure this addon under the `'ember-this-fallback'` key in the `EmberApp` constructor options:

```js
"use strict";

const EmberApp = require("ember-cli/lib/broccoli/ember-app");

module.exports = function (defaults) {
  const app = new EmberApp(defaults, {
    //...
    "ember-this-fallback": {
      /**
       * Disable all logging, including debug logging (even with the `DEBUG`
       * environment variable) and logging to `ember-this-fallback-plugin.log`.
       */
      enableLogging: false,
    },
  });
  // ...
};
```

## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.

## License

This project is licensed under the [MIT License](LICENSE.md).
