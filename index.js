'use strict';

module.exports = {
  name: require('./package').name,

  setupPreprocessorRegistry: function (type, registry) {
    registry.add('htmlbars-ast-plugin', this._buildPlugin());
  },

  _buildPlugin() {
    const ThisFallbackPlugin = require('./lib/this-fallback-plugin');

    // HACK: Seems strange that this is necessary, but without it we get:
    // broccoli-babel-transpiler is opting out of caching due to a plugin that does not provide a caching strategy
    ThisFallbackPlugin.baseDir = () => __dirname;

    return {
      name: 'ember-this-fallback',
      baseDir: () => __dirname,
      plugin: ThisFallbackPlugin,
    };
  },
};
