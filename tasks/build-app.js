/**
 * @class BuildTask
 * @constructor
 * @param [options] {Object} configuration options for the browserify (build-app) task.
 *   @param [options.skip=false] {Boolean} whether to skip (true) or run (false) the browserify task.
 *   @param [options.transformStack] {String[] or Object[]} configuration for each item of the browserify transforms.
 *                                               can either be a string identifying the transform or an object of the format:
 *                                                 {name: 'name of transform', options: {// transform options}}
 *   @param [options.root='./<options.src>/scripts/main'] {String} the root file to bundle.
 *   @param [options.out='app.js'] {String} name for the bundled file (or full path of the bundled file).
 *   @param [options.failOnError=false] {Boolean} whether the browserify pipe should fail when browserifying fails.
 *   @param [options.debug=$.util.env.type !== 'production'] {Boolean} whether to run browserify in debug mode.
 *                                                                       Defaults to true if the env type is production, false otherwise.
 *   @param [options.dist='<options.dist>/scripts] {String} name for the bundled file (or full path of the bundled file).
 */
module.exports = function(gulp, options) {
  var browserifyBundler,
      _ = require('lodash'),
      gulpLoadPlugins = require('gulp-load-plugins'),
      $ = gulpLoadPlugins({}),
      log = require('color-log'),
      watchify = require('watchify'),
      browserify = require('browserify'),
      currentDateTime = require('../currentDateTime'),
      source = require('vinyl-source-stream'),
      buffer = require('vinyl-buffer'),
      defaultOptions = {
        skip: false,
        transformStack: [],
        root: './app/app',
        out: 'app.js',
        failOnError: false,
        debug: $.util.env.type !== 'production',
        dist: 'dist/scripts'
      };

  options = _.merge({}, defaultOptions, options);

  function configureBrowserify(browserifyBundler) {
    browserifyBundler.add(options.root);
    options.transformStack.forEach(function(transform) {
      if (transform.name) {
        browserifyBundler.transform(transform.name, transform.options);
      } else {
        browserifyBundler.transform(transform);
      }
    })
  };

  /* Reduce all javascript to app.js */
  function buildApp() {
    return browserifyBundler.bundle()
      .on('error', function(err) {
        delete err.stream;
        log.error('[BROWSERIFY] @ ' + currentDateTime());
        log.warn(err.toString());
        if (!browserifyBundler.continueOnError && options.failOnError) {
          throw err;
        }
        return true;
      })
      .pipe(source(options.out))
      .pipe(buffer())
      .pipe($.util.env.type !== 'production' ? $.sourcemaps.init({loadMaps: true}) : $.util.noop())
      .pipe($.util.env.type === 'production' ? $.uglify() : $.util.noop())
      .pipe($.util.env.type !== 'production' ? $.sourcemaps.write('./') : $.util.noop())
      .pipe(gulp.dest(options.dist));
  };
  gulp.task(options.taskPrefix + 'build-app', buildApp);

  return {
    createBundler: function() {
      watchify.args.debug = options.debug;
      browserifyBundler = browserify(watchify.args);
      configureBrowserify(browserifyBundler);
      return browserifyBundler;
    },

    createWatchifyBundler: function() {
      watchify.args.debug = options.debug;
      browserifyBundler = watchify(browserify(watchify.args));
      browserifyBundler.continueOnError = true;
      configureBrowserify(browserifyBundler);
      browserifyBundler.on('update', buildApp);
      browserifyBundler.on('log', function(data) {
        log.mark('[BROWSERIFY] ' + data.toString());
      });
      return browserifyBundler;
    },

    options: function(newOptions) {
      options = _.merge({}, defaultOptions, newOptions);
    }
  }
};