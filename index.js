module.exports = function(gulp, bundleOptions) {
  var buildTask, watchTask,
      gulpLoadPlugins = require('gulp-load-plugins'),
      $ = gulpLoadPlugins({}),
      del = require('del'),
      log = require('color-log'),
      pathLib = require('path'),
      runSequence = require('run-sequence').use(gulp),
      buildTaskGenerator = require('./tasks/build'),
      watchTaskGenerator = require('./tasks/watch'),
      mergeBundleDefaults = require('./tasks/mergeBundleDefaults');

  bundleOptions = mergeBundleDefaults(bundleOptions);
  buildTask = buildTaskGenerator(gulp, bundleOptions);
  watchTask = watchTaskGenerator(gulp, bundleOptions);

  /* Returns public configuration API */
  return {
    /**
     * @method transform
     * @param transform {String or Object} either a string referencing the transform to perform or an object
     *                  can either be a string identifying the transform or an object of the format:
     *                    {name: 'name of transform', options: {// transform options}}
     */
    transform: function(transform) {
      bundleOptions.browserify.transforms.push(transform);

      bundleOptions = mergeBundleDefaults({
        browserify: {
          transforms: options.browserify.transforms
        }
      });

      buildTask.options(bundleOptions);
      watchTask.options(bundleOptions);
    },

    /**
     * @method nonResources
     * @param excludes {String} regex that defines which files to exclude from the copy-resources task.
     */
    nonResources: function(excludes) {
      bundleOptions = mergeBundleDefaults({
        browserify: {
          excludes: excludes
        }
      });

      buildTask.options(bundleOptions);
      watchTask.options(bundleOptions);
    },

    /**
     * @method options
     * @param newOptions {Object} <same as the options that are part of the constructor>
     */
    options: function(newOptions) {
      bundleOptions = mergeBundleDefaults(newOptions);

      buildTask.options(bundleOptions);
      watchTask.options(bundleOptions);
    }
  };
};
