'use strict';

const ThisFallbackPlugin = require('./lib/this-fallback-plugin');
const getOptions = require('./lib/options').getOptions;

module.exports = {
  name: require('./package').name,

  setupPreprocessorRegistry(type, registry) {
    if (type === 'parent') {
      const options = getOptions(findHost(this));
      registry.add('htmlbars-ast-plugin', this._buildPlugin(options));
    }
  },

  _buildPlugin(options) {
    ThisFallbackPlugin.baseDir = () => __dirname;
    ThisFallbackPlugin.cacheKey = () => 'ember-this-fallback';

    return {
      name: 'ember-this-fallback',
      parallelBabel: {
        requireFile: __filename,
        buildUsing: '_buildPlugin',
        params: options,
      },
      plugin: ThisFallbackPlugin(options),
    };
  },
};

// HACK: Borrowed from https://github.com/empress/ember-showdown-prism/blob/73a86d5680979c170a8589d723b4ba028bcf81af/index.js#LL42C1-L52C2
function findHost(addon) {
  let current = addon;
  let app;

  do {
    app = current.app || app;
  } while (current.parent.parent && (current = current.parent));

  return app;
}
