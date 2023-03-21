# How To Contribute

## Installation

- `git clone <repository-url>`
- `cd ember-this-fallback`
- `yarn install`

## Linting

- `yarn lint`
- `yarn lint:fix`

## Running tests

- `yarn test` – Runs the test suite on the current Ember version
- `ember test --server` – Runs the test suite in "watch mode"
- `yarn test:ember-compatibility` – Runs the dummy test suite against multiple Ember versions

## Running the dummy application

- `yarn start`
- Visit the dummy application at [http://localhost:4200](http://localhost:4200).

For more information on using ember-cli, visit [https://cli.emberjs.com/release/](https://cli.emberjs.com/release/).

## Debugging

This plugin uses [the `debug` library](https://www.npmjs.com/package/debug) to log messages. You can see this output by setting the `DEBUG` environment variable to `*` or `ember-this-fallback-plugin`. Typically, environment variables specific to a command are set by prefixing the command. For example:

```shell
DEBUG=ember-this-fallback-plugin yarn start
```
