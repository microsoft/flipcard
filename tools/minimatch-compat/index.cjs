'use strict';

const modern = require('minimatch-modern');

// These legacy consumers require a callable CommonJS export, not the removed parser internals.
function minimatch(path, pattern, options) {
  return modern.minimatch(path, pattern, options);
}

module.exports = Object.assign(minimatch, modern);
