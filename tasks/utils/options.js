var _ = require('lodash')
    $ = require('gulp-load-plugins')({});

var options = {};

module.exports = options;

module.exports.updateOptions = function(newOptions) {
  console.log("newOptions: ", newOptions)
  var bundleDefaults,
      baseBundleDefaults = {
        taskPrefix: '',
        src: 'app',
        dist: 'dist',
        clean: {}, // see defaults in ./tasks/clean.js - only included here for the skips below.
        browserify: {}, // see defaults in ./tasks/build-app.js - only included here for the skips below.
        styles: {}, // see defaults in ./tasks/build-styles.js - only included here for the skips below.
        copy: {} // see defaults in ./tasks/copy-resources.js - only included here for the skips below.
      };

  // Properties used in the defaults below.  2nd merge is to perserve the options object reference.
  _.merge(options, _.merge(baseBundleDefaults, options, newOptions));

  bundleDefaults = {
    clean: {
      skip: false,
      dist: options.dist
    },
    browserify: {
      skip: false,
      root: './' + options.src + '/app',
      transforms: [],
      out: 'app.js',
      failOnError: false,
      debug: $.util.env.type !== 'production',
      dist: options.dist
    },
    styles: {
      skip: false,
      includes: [],
      root: options.src + '/app.scss',
      dist: options.dist
    },
    copy: {
      skip: false,
      src: options.src,
      excludes: 'scss',
      dist: options.dist
    },
  };

  // 2nd merge is to perserve the options object reference.
  _.merge(options, _.merge(bundleDefaults, options));

  return options;
};
