# ember-this-fallback

Polyfills [Ember's deprecated Property Fallback Lookup feature](https://deprecations.emberjs.com/v3.x/#toc_this-property-fallback) to allow apps to continue using it without blocking Ember 4.0+ upgrades.

## Compatibility

- Ember.js v3.28 or above
- Ember CLI v3.28 or above
- Node.js v14 or above

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

    - If the `MustacheStatement` is the child of an `AttrNode` with a name NOT starting with `@`:

      Wrap the invocation with an `isHelper` helper to determine if it is a helper at runtime and fallback to the `this` property if not ("ambiguous attribute fallback").

      ```hbs
      {{! before }}
      <Parent id={{property}} />

      {{! after }}
      <Parent
        id={{(if
          (isHelper "property") (lookupHelper "property") this.property
        )}}
      />
      ```

    - Otherwise:

      Wrap the invocation with an `isInvocable` helper to determine if it is a component or helper at runtime and fallback to the `this` property if not ("ambiguous statement fallback").

      ```hbs
      {{! before }}
      {{property}}

      {{! after }}
      {{#if (isInvocable "property")}}
        {{property}}
      {{else}}
        {{this.property}}
      {{/if}}
      ```

### Caveats

#### Runtime implications

The `isInvocable`, `isHelper`, and `lookupHelper` helpers have runtime implications that may have performance impacts. Thus, we recommend relying on this addon only temporarily to unblock 4.0+ upgrades while continuing to migrate away from reliance on the Property Fallback Lookup feature.

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

## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.

## License

This project is licensed under the [MIT License](LICENSE.md).
