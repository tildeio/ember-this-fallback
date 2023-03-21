'use strict';

var ThisFallbackPlugin = require('./lib/this-fallback-plugin');

module.exports = {
  name: require('./package').name,

  included: function () {
    const plugin = ThisFallbackPlugin;
    plugin.baseDir = () => {
      return __dirname;
    };
    plugin.cacheKey = () => {
      return 'ember-this-fallback';
    };

    this.app.registry.add('htmlbars-ast-plugin', {
      name: 'ember-this-fallback',
      plugin,
    });

    Reflect.apply(this._super.included, this, arguments);
  },
};
