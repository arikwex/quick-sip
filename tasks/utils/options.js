var _ = require('lodash'),
    $ = require('gulp-load-plugins')({});

// Function creates a new options object each time
// This options object should be generated once for each execution of quick-sip
// and passed into all task registrations that require this object
module.exports = function() {
  var topLevelDefaults = {
        taskPrefix: '',
        src: 'app',
        dist: 'dist',
        clean: {},
        browserify: {},
        styles: {},
        copy: {}
      },
      options;

  // Generate defaults from an options parameter
  function generateBundleDefaults(opts) {
    return {
      clean: {
        skip: false,
        dist: opts.dist
      },
      browserify: {
        skip: false,
        root: './' + opts.src + '/app',
        transforms: [],
        out: 'app.js',
        failOnError: false,
        debug: $.util.env.type !== 'production',
        dist: opts.dist
      },
      styles: {
        skip: false,
        includes: [],
        root: opts.src + '/app.scss',
        dist: opts.dist
      },
      copy: {
        skip: false,
        src: opts.src,
        excludes: 'scss',
        dist: opts.dist
      }
    };
  }

  options = _.merge({}, topLevelDefaults, generateBundleDefaults(topLevelDefaults));

  // Update options
  // For certain options, if a key isn't defined at the bundle level, it will default to the value specified at the top level
  options.update = function(newOptions) {
    var bundleDefaults = generateBundleDefaults(newOptions);

    return _.merge(options, bundleDefaults, newOptions);
  };

  return options;
};