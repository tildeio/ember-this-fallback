'use strict';

module.exports = {
  name: require('./package').name,

  setupPreprocessorRegistry: function (type, registry) {
    registry.add('htmlbars-ast-plugin', this._buildPlugin());
  },

  _buildPlugin() {
    return {
      name: 'ember-this-fallback',
      baseDir: () => __dirname,
      plugin: require.resolve('./lib/this-fallback-plugin'),
    };
  },
};
