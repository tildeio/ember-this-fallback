# Ember's `This Fallback` Behavior

Prior to Ember 4.0, Ember's template syntax included a feature called "This Fallback."

This meant that Ember would interpret a bare variable name like `hello` as `this.hello` under certain circumstances.

<dl>
  <dt>this fallback</dt>
  <dd>The feature described in this document, which causes Ember to interpret <code>variableName</code> as <code>this.variableName</code> under certain circumstances. <em>This feature was removed in Ember 4.0.</em>
  </dd>
  <dt>variable reference</dt>
  <dd>A valid Handlebars variable name (such as <code>hello</code>, <code>varName</code>, or <code>hello-world</code>)
  </dd>
  <dt>local variable reference</dt>
  <dd>
  A variable reference that refers to a Handlebars local variable binding (created using <code>as |varName|</code>).
  </dd>
  <dt><code>this</code> refererence</dt>
  <dd>A <em>variable reference</em> that refers to the current <code>this</code> context of the template.
  </dd>
  <dt>Named Argument Reference ("at-name")</dt>
  <dd>A variable reference that refers to a named argument using <code>@{identifier}</code> syntax.</dd>
  <dt>Ambiguous variable reference</dt>
  <dd>A <em>variable reference</em> that is not a <em>local variable reference</em>, a <em><code>this</code> reference, or a <em>named argument reference</em>.
  </dd>
  <dt>Property Path</dt>
  <dd>
    A dot-separated path that begins with a <em>variable reference</em>.
    This <em>variable reference</em> segment is a candidate for <em>this fallback</em> behavior under the circumstances described in this document.
    </dd>

</dl>

> [!IMPORTANT]
>
> **Only** _ambiguous variable references_ are candidates for _this fallback_ behavior.
>
> This excludes:
>
> 1. _local variable reference_
> 2. _this reference_
> 3. _named argument reference_

## Lexical Scope Intuition

The lexical scope of a _classic_ Handlebars template has:

1. Local variables, bound with `as |var-name|` and referenced via path expressions (`var-name` or `var-name.property...`). These variables are in the `local` namespace.
2. Global variable references, in one of the following namespaces:
    1. `html`
    2. `component`
    3. `helper`
    4. `modifier`
    5. `value`
    6. `ambiguous::content`
    7. `ambiguous::attr-value`
    8. `keyword` (such as `yield`, `if`, etc.)

> [!IMPORTANT]
> 
> The namespaces are determined **by the parser** and are purely syntactic. For the most part, they map onto straight-forward user intuitions about what the syntax means. The `ambiguous` namespaces are an exception: they are ambiguous from a human understanding perspective, and _this fallback_ behjavior makes them worse.
>
> Global variables in the _value_ namespaces have _this fallback_ behavior (in Ember 3.28), as do global variables in the _ambiguous_ namespaces.
>
> **No other namespaces have _this fallback_ behavior.**

Global variable references in the `value` and `ambiguous` namespaces have _this fallback_ behavior in Ember 3.28, **but it was removed in Ember 4.0**.

> [!NOTE]
>
> _Variable references_ with _this fallback_ behavior are annotated with `^^^`.

```hbs
<SomeComponent @arg={{some-var}} />
{{!                   ^^^^^^^^}}

{{#let (hash component=@some.component value=12) as |t|}}
  <t.component @arg1={{some-var}} @arg2={{(some-helper t.value some-var)}} 
{{!                    ^^^^^^^^                                ^^^^^^^^}}
{{/let}}

<div title={{maybe-helper}} role={{get-role some-var}}>
{{!          ^^^^^^^^^^^^                   ^^^^^^^^}}
  {{yield}}
  {{very-ambiguous}}
{{! ^^^^^^^^^^^^^^}}
</div>

{{#let (fields-for @model) as |f|}}
  <f.input @field="user" />
  {{!-- since f _is_ in scope, f is a normal local variable and
        there is no _this fallback_ behavior --}}
{{/let}}

<some.Component />
{{! since some is not in local scope, this is a ❗️syntax error❗️}}
```

These examples are equivalent to this template, with namespaces made explicit (and prefixed with `%`):

> [!NOTE]
>
> These resolution rules exist in the parser, in largely this form. The elaborated **syntax** was created for this explanation and doesn't exist elsewhere (yet?).
>
> In this example, _variable references_ with _this fallback_ behavior are annotated with `^^^` and their associated namespace is annotated with `~~~`.

```hbs
<%component@SomeComponent @arg={%value@some-var} />

{{%keyword@let (%keyword@hash component=@some.component value=12) as |%local@t|}}
  <%local@t.component
    @arg1={{%value@some-var}}
  {{!       ~~~~~~~^^^^^^^^ some-var has _this fallback_ behavior}}
    @arg2={{(%helper@some-helper %local@t.value %value@some-value)}}
  {{!--                                         ~~~~~~~^^^^^^^^^^
                                                some-value has _this fallback_ behavior
  --}}  
  />
{{/%keyword@let}}

<html@div
  title={{%ambiguous::attr-value@maybe-helper}}
  {{!--   ~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^ 
          maybe-helper has _this fallback_ behavior, but only if maybe-helper does not
          resolve to a helper
  --}}
  role={{%helper@get-role %value@some-var}}
  {{!                     ~~~~~~~^^^^^^^^ some-var has _this fallback_ behavior}}
>
    {{%keyword@yield}}
    {{%ambiguous::content@very-ambiguous}}
{{!-- ~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^ 
      very-ambiguous has _this fallback_ behavior, but only if very-ambiguous does
      not resolve to a component or helper
--}}
</html@div>

{{#%keyword@let (%helper@fields-for @model) as |%local:f|}}
  <%local:f.input @field="user" />
{{/let}}
```

## High-Level Intuition

The basic intuition of _this fallback_ behavior is:

> When a piece of syntax that could be a _path expression_ is used _as a value_, and the variable at the front of the path is not in local Handlebars scope, it falls back to `this.var-name` if necessary.

_This fallback_ behavior happens far less frequently than you might expect, and when it happens, the consequences are fairly constrained.

This is because:

1. It doesn't apply to unambiguous syntax like `<ComponentName>`, `{{modifier-name}}` or `(helper-name with args)`.
2. When it applies to [arguments](#argument-position), _this fallback_ behavior is the **only option** after ruling out local variables.
3. When it applies to ambiguous syntax, it only applies *after* determining that there is no component or helper with that name.

This means that it applies to only these scenarios, and only if `var-name` is not in local scope:

1. In content position (`{{var-name}}`), if there is no component or helper named `var-name`, and only if there are zero arguments.
2. In attribute value position (`attr={{var-name}}`), if there is no helper named `var-name`, and only if there are zero arguments.
3. In any _argument_ position (`(some-helper this or.this or=even.this)`). But since this only applies if the _variable reference_ is not in scope, it's possible to determine, completely statically, when the rule applies. TL;DR it only applies if the variable is not in local scope, and the only possible fix is to prefix `this.`.

## Syntax Positions

The behavior of _this fallback_ is different depending on the syntactic position. This section describes the relevant differences.

### Angle-Bracket Callee (`<ComponentName />`)

|                          |                          |
| ------------------------ | ------------------------ |
| Namespace                | `component`              |
| _This fallback_ behavior | Never                    |

An HTML tag name that **syntactically** meets one of these criteria is a Glimmer _Property Path_.

1. begins with a capital letter
2. is a path that begins with _local variable reference_
3. is a path with at least two segments (i.e. contains a dot)

> [!IMPORTANT]
>
> None of these variable references are candidates for _this fallback_ behavior.

```ts
{{!-- 
  ⛔️ None of these examples are candidates for this fallback behavior ⛔️
}}

{{! the path is `ComponentName`}}
<ComponentName />

{{! the path is `f.input` and the variable reference is `f`}}
<f.input />

{{! the path is @arg}}
<@arg />

{{! the path is @arg.property and the variable reference is `@arg`}}
<@arg.property />

{{#let @arg.property as |comp|}}
  {{! the path is comp}}
  <comp />

  {{! the path is comp.child and the variable reference is `comp`}}
  <comp.child>
{{/let}}
```

### Modifier Callee (`<ComponentName {{autofocus}} />`)

|                          |                          |
| ------------------------ | ------------------------ |
| Namespace                | `modifier`              |
| _This fallback_ behavior | Never                    |

The callee of a modifier invocation is **always** a Glimmer _Property Path_.


> [!IMPORTANT]
>
> None of these variable references are candidates for _this fallback_ behavior.
>
> **It doesn't matter whether the modifier has any arguments.**

```ts
{{!-- 
  ⛔️ None of these examples are candidates for this fallback behavior ⛔️
}}

{{! the path is `modifier-name`}}
<div {{modifier-name}} />

{{! the path is `name.modifier` and the variable reference is `name`}}
<div {{name.modifier}} />

{{! the path is @arg}}
<@arg />

{{! the path is @arg.property and the variable reference is `@arg`}}
<@arg.property />

{{#let @arg.property as |comp|}}
  {{! the path is comp}}
  <comp />

  {{! the path is comp.child and the variable reference is `comp`}}
  <comp.child>
{{/let}}
```

### Helper Callee

|                          |                          |
| ------------------------ | ------------------------ |
| Namespace                | `helper`                 |
| _This fallback_ behavior | Never                    |


When a syntax is unambiguously a _helper invocation_, its callee is **always** a Glimmer _Property Path_.

A syntax is unambiguously a _helper invocation_ if it meets one of the following criteria:

1. It is the callee in a subexpression (i.e. `(helper-name)` or `(helper-name arg)`, regardless of whether the subexpression has any arguments.
2. It is the callee in `{{curly syntax}}` **and** it has at least one positional or named argument. This includes attribute values.

> [!TIP]
>
> The intuition is: "it looks like a call expression and isn't an [ambiguous invocation][#ambiguous-invocation].

### Ambiguous Content

|                          |                                                          |
| ------------------------ | -------------------------------------------------------- |
| Namespace                | `ambiguous:content`                                      |
| _This fallback_ behavior | If the variable name is not a global helper or component |

_Ambiguous content_:

1. appears in _content position_ 
2. consistents of only a single _ambiguous variable reference_ (the _ambiguous name_), and has no arguments of any kind.
3. is not an Ember *content* keyword such as `{{yield}}`.

If the _ambiguous name_ is `var-name`, this syntax (`{{var-name}}` in content position) could mean any of the following:

1. Invoke a helper named `var-name`
2. Invoke a component named `var-name`
3. ~(_this fallback_) Look up `this.var-name`~ (removed in Ember 4.0)

### Ambiguous Attribute Value

|                          |                                             |
| ------------------------ | ------------------------------------------- |
| Namespace                | `ambiguous:attr`                            |
| _This fallback_ behavior | If the variable name is not a global helper |

An _ambiguous attribute value_:

1. appears in _attribute value position_
2. consistents of only a single _ambiguous variable reference_ (the _ambiguous name_), and has no arguments of any kind.
3. is not an Ember *helper* keyword (such as `if`).

If the _ambiguous name_ is `var-name`, this syntax (`attr={{var-name}}` in content position) could mean:

1. Invoke a helper named `var-name`
2. ~(_this fallback_) Look up `this.var-name`~ (removed in Ember 4.0)

> [!NOTE] In Ember 4.0, this syntax is unambiguous.

### Argument Position

|                          |                          |
| ------------------------ | ------------------------ |
| Namespace                | `value`                  |
| _This fallback_ behavior | Always                   |

> [!TIP]
>
> Intuitively, an _argument position_ is an argument passed to any kind of invocation.

The _argument position_ syntax is any of these:

1. Positional arguments in all curly syntaxes (components, helpers, modifiers, content, etc.) and subexpressions.
2. Argument values passed as named arguments in all curly syntaxes and subexpressions.
3. Argument values passed as named arguments via angle-bracket component invocations.

#### 1. Positional Arguments in Curly Syntaxes and Subexpressions

```hbs
{{any-curly positional bare or.path}}
{{!         ^^^^^^^^^^ ^^^^ ^^~~~~~}}

{{any-curly (some-helper bare or.path (also nested or.path))}}
{{!                      ^^^^ ^^~~~~~       ^^^^^^ ^^~~~~  ~}}

{{! examples of any-curly }}

{{component-name positional bare or.path}}
{{!              ^^^^^^^^^^ ^^^^ ^^~~~~~}}
{{component-name (some-helper positional bare or.path (also nested or.path))}}
{{!                           ^^^^^^^^^^ ^^^^ ^^~~~~~       ^^^^^^ ^^~~~~~ }}

<div {{modifier-name positional bare or.path}} />
{{!                  ^^^^^^^^^^ ^^^^ ^^~~~~~    }}
<div {{modifier-name (some-helper positional bare or.path (also nested or.path))}} />

<Component class={{some-cx positional bare or.path}} />
{{!                        ^^^^^^^^^^ ^^^^ ^^~~~~~}}
<Component class={{some-cx (some-helper positional bare or.path (also nested or.path))}} />
{{!                                     ^^^^^^^^^^ ^^^^ ^^~~~~~       ^^^^^^ ^^~~~~~ }}
```

> [!INFO]
>
> The variable reference is annotated via `^^^` and the rest of the path expression is annotated via `~~~`.

#### 2. Named Arguments in Curly Syntaxes

```hbs
{{any-curly a=value b=or.path c=(any-helper a=nested b=or.path) }}
{{!           ^^^^^   ^^~~~~~                 ^^^^^^   ^^~~~~~  }}

{{! examples of any-curly }}

{{component-name a=value b=or.path}}
{{!                ^^^^^   ^^~~~~~}}
{{component-name (some-helper a=value b=or.path) c=(any-helper a=nested b=or.path)}}
{{!                             ^^^^^   ^^~~~~~                  ^^^^^^   ^^~~~~~ }}

<div {{modifier-name a=value b=or.path}} />
{{!                    ^^^^^   ^^~~~~~    }}
<div {{modifier-name (some-helper a=value b=or.path) c=(any-helper a=nested b=or.path)}} />
{{!                                 ^^^^^   ^^~~~~~                  ^^^^^^   ^^~~~~~ }}

<Component class={{some-cx a=value b=or.path}} />
{{!                          ^^^^^   ^^~~~~~   }}
<Component class={{some-cx (some-helper a=value b=or.path) c=(any-helper a=nested b=or.path)}} />
{{!                                       ^^^^^   ^^~~~~~                  ^^^^^^   ^^~~~~~    }}
```

#### 3. Named Arguments in Angle-Bracket Syntaxes

```hbs
<Component @a={{value}} @b={{or.path}} />
{{!             ^^^^^        ^^~~~~~   }}

<Component @a={{value}} @b={{or.path}} />
{{!             ^^^^^        ^^~~~~~   }}

<Component @named={{(any-helper a=nested b=or.path)}} />
{{!                               ^^^^^    ^^~~~~~    }}

```