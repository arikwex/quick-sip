var $ = require('gulp-load-plugins')({}),
    log = require('color-log'),
    watchify = require('watchify'),
    browserify = require('browserify'),
    currentDateTime = require('./utils/currentDateTime'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    options = require('./utils/options');

module.exports = function(gulp, newBrowserifyOptions) {
  var browserifyBundler;

  options.updateOptions({ browserify: newBrowserifyOptions });

  function configureBrowserify(browserifyBundler) {
    browserifyBundler.add(options.browserify.root);
    options.browserify.transforms.forEach(function(transform) {
      if (transform.transform) {
        browserifyBundler.transform(transform.transform, transform.options);
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
        if (!browserifyBundler.continueOnError && options.browserify.failOnError) {
          throw err;
        }
        return true;
      })
      .pipe(source(options.browserify.out))
      .pipe(buffer())
      .pipe($.util.env.type !== 'production' ? $.sourcemaps.init({loadMaps: true}) : $.util.noop())
      .pipe($.util.env.type === 'production' ? $.uglify() : $.util.noop())
      .pipe($.util.env.type !== 'production' ? $.sourcemaps.write('./') : $.util.noop())
      .pipe(gulp.dest(options.browserify.dist));
  };

  if (!options.browserify.skip) {
    /* Reduce all javascript to app.js */
    gulp.task(options.taskPrefix + 'build-app', buildApp);
  }

  return {
    createBundler: function() {
      watchify.args.debug = options.browserify.debug;
      browserifyBundler = browserify(watchify.args);
      configureBrowserify(browserifyBundler);
      return browserifyBundler;
    },

    createWatchifyBundler: function() {
      watchify.args.debug = options.browserify.debug;
      browserifyBundler = watchify(browserify(watchify.args));
      browserifyBundler.continueOnError = true;
      configureBrowserify(browserifyBundler);
      browserifyBundler.on('update', buildApp);
      browserifyBundler.on('log', function(data) {
        log.mark('[BROWSERIFY] ' + data.toString());
      });
      return browserifyBundler;
    }
  }
};