'use strict';

const getChannelURL = require('ember-source-channel-url');
const { embroiderSafe, embroiderOptimized } = require('@embroider/test-setup');

const types = {
  '@types/ember': '^4.0.0',
  '@types/ember__application': '^4.0.0',
  '@types/ember__array': '^4.0.0',
  '@types/ember__component': '^4.0.0',
  '@types/ember__controller': '^4.0.0',
  '@types/ember__debug': '^4.0.0',
  '@types/ember__destroyable': '^4.0.0',
  '@types/ember__engine': '^4.0.0',
  '@types/ember__error': '^4.0.0',
  '@types/ember__helper': '^4.0.0',
  '@types/ember__modifier': '^4.0.0',
  '@types/ember__object': '^4.0.0',
  '@types/ember__owner': '^4.0.0',
  '@types/ember__polyfills': '^4.0.0',
  '@types/ember__routing': '^4.0.0',
  '@types/ember__runloop': '^4.0.0',
  '@types/ember__service': '^4.0.0',
  '@types/ember__string': '^3.0.0',
  '@types/ember__template': '^4.0.0',
  '@types/ember__test': '^4.0.0',
  '@types/ember__utils': '^4.0.0',
};

module.exports = async function () {
  return {
    useYarn: true,
    scenarios: [
      {
        name: 'ember-lts-3.28',
        npm: {
          devDependencies: {
            'ember-source': '~3.28.0',
            ...types,
          },
        },
      },
      {
        name: 'ember-lts-4.4',
        npm: {
          devDependencies: {
            'ember-source': '~4.4.0',
            ...types,
          },
        },
      },
      {
        name: 'ember-release',
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('release'),
          },
        },
      },
      {
        name: 'ember-beta',
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('beta'),
          },
        },
      },
      {
        name: 'ember-canary',
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('canary'),
          },
        },
      },
      {
        name: 'ember-classic',
        env: {
          EMBER_OPTIONAL_FEATURES: JSON.stringify({
            'application-template-wrapper': true,
            'default-async-observers': false,
            'template-only-glimmer-components': false,
          }),
        },
        npm: {
          devDependencies: {
            'ember-source': '~3.28.0',
            ...types,
          },
          ember: {
            edition: 'classic',
          },
        },
      },
      embroiderSafe(),
      embroiderOptimized(),
    ],
  };
};
