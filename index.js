'use strict';

var HelloTransform = require('./lib/hello');

module.exports = {
  name: require('./package').name,

  included: function () {
    // we have to wrap these in an object so the ember-cli
    // registry doesn't try to call `new` on them (new is actually
    // called within htmlbars when compiling a given template).
    this.app.registry.add('htmlbars-ast-plugin', {
      name: 'hello-transform',
      plugin: HelloTransform,
    });

    Reflect.apply(this._super.included, this, arguments);
  },
};
