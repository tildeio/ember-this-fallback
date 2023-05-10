'use strict';

const ThisFallbackPlugin = require('./lib/this-fallback-plugin');

module.exports = {
  name: require('./package').name,

  setupPreprocessorRegistry(type, registry) {
    // This check ensures that the plugin runs only on the app's code, not on
    // this addon's own code.
    if (type === 'parent') {
      registry.add('htmlbars-ast-plugin', this._buildPlugin());
    }
  },

  _buildPlugin() {
    ThisFallbackPlugin.baseDir = () => __dirname;
    ThisFallbackPlugin.cacheKey = () => 'ember-this-fallback';

    return {
      name: 'ember-this-fallback',
      parallelBabel: {
        requireFile: __filename,
        buildUsing: '_buildPlugin',
        params: {},
      },
      plugin: ThisFallbackPlugin,
    };
  },
};
