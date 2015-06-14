/**
 * @class Quick-Sip
 * @constructor
 * @param gulp {Gulp} reference to the gulp object.
 * @param [options] {Object} configuration options for the build task.
 *  @param [options.src='app'] {String} the path to the root src directory.
 *  @param [options.dist='dist'] {String} the path to the root distribution directory.
 *  @param [options.taskPrefix=''] {String} prefix to use for all task names.
 *  @param [options.clean] {Object} Configuration for the clean (clean) task.
 *    @param [options.clean.skip=false] {Boolean} false - run the clean task during the 'build' task.  true - skip the clean task.
 *    @param [options.clean.dist='<options.dist>'] {String} directory to rm when running the clean task.
 *  @param [options.browserify] {Object} configuration options for the browserify (build-app) task.
 *    @param [options.browserify.skip=false] {Boolean} whether to skip (true) or run (false) the browserify task.
 *    @param [options.browserify.transformStack] {String[] or Object[]} configuration for each item of the browserify transforms.
 *                                               can either be a string identifying the transform or an object of the format:
 *                                                 {name: 'name of transform', options: {// transform options}}
 *    @param [options.browserify.root='./<options.src>/scripts/main'] {String} the root file to bundle.
 *    @param [options.browserify.out='app.js'] {String} name for the bundled file (or full path of the bundled file).
 *    @param [options.browserify.failOnError=false] {Boolean} whether the browserify pipe should fail when browserifying fails.
 *    @param [options.browserify.debug=$.util.env.type !== 'production'] {Boolean} whether to run browserify in debug mode.
 *                                                                       Defaults to true if the env type is production, false otherwise.
 *    @param [options.browserify.dist='<options.dist>/scripts] {String} name for the bundled file (or full path of the bundled file).
 *  @param [options.sass] {Object} configuration options for the sass (build-styles) task.
 *    @param [options.sass.skip=false] {Boolean} whether to skip (true) or run (false) the sass task.
 *    @param [options.sass.src='<options.src>/**//*.scss'] {String} all sass source files to include.
 *    @param [options.sass.root='<options.src>/app'] {String} the root sass file to bundle.
 *    @param [options.sass.includes=[]] {String[]} additional sass paths to include.
 *    @param [options.sass.dist='<options.dist>'] {String} the location of the location of the resulting .css file.
 *  @param [options.copy] {Object} configuration options for the resource copy (copy-resources) task.
 *    @param [options.copy.skip=false] {Boolean} whether to skip (true) or run (false) the copy resources task.
 *    @param [options.copy.excludes='js|css|scss'] {String} regex of resources to exclude when copying.
 *    @param [options.copy.src='<options.src>'] {String} src directory of resources to include in the copy
 *                                              (will have '/**//*.*' appended to it for the copy and it will exclude the excludes).
 *    @param [options.copy.dist='<options.dist>'] {String} distribution directory to copy the resources to.
 */
module.exports = function(gulp, options) {
  var _ = require('lodash'),
      fs = require('fs'),
      gulpLoadPlugins = require('gulp-load-plugins'),
      $ = gulpLoadPlugins({}),
      del = require('del'),
      log = require('color-log'),
      pathLib = require('path'),
      source = require('vinyl-source-stream'),
      buffer = require('vinyl-buffer'),
      watchify = require('watchify'),
      browserify = require('browserify'),
      runSequence = require('run-sequence').use(gulp);

  var browserifyBundler,
      buildTasks = [];

  // Properties used in the defaults below.
  options = _.merge({
    src: 'app',
    dist: 'dist'
  }, options);

  // Default options
  options = _.merge({
    taskPrefix: '',
    clean: {
      skip: false,
      dist: options.dist
    },
    browserify: {
      skip: false,
      transformStack: [],
      root: './' + options.src + '/scripts/main',
      out: 'app.js',
      failOnError: false,
      debug: $.util.env.type !== 'production',
      dist: options.dist + '/scripts'
    },
    sass: {
      skip: false,
      src: options.src + '/**/*.scss',
      root: options.src + '/app',
      includes: [],
      dist: options.dist
    },
    copy: {
      skip: false,
      excludes: 'js|css|scss',
      src: options.src,
      dist: options.dist
    }
  }, options);

  // Setup build tasks.
  if (!options.copy.skip) {
    buildTasks.push(options.taskPrefix + 'copy-resources');
  }

  if (!options.sass.skip) {
    buildTasks.push(options.taskPrefix + 'build-styles');
  }

  if (!options.browserify.skip) {
    buildTasks.push(options.taskPrefix + 'build-app');
  }

  /* Current date-time printer */
  function currentDateTime() {
    var date = new Date(),
        datetime = '';
    datetime += date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ' ';
    datetime += (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
    return datetime;
  };

  /* Browserify bundler */
  watchify.args.debug = ($.util.env.type !== 'production' || options.debug);
  function configureBrowserify(browserifyBundler) {
    browserifyBundler.add(options.browserify.root);
    options.browserify.transformStack.forEach(function(transform) {
      if (transform.name) {
        browserifyBundler.transform(transform.name, transform.options);
      } else {
        browserifyBundler.transform(transform);
      }
    })
  };

  /* Clean the options.dist directory */
  gulp.task(options.taskPrefix + 'clean', function(callback) {
    if (!options.clean.skip) {
      log.mark('[CLEAN] deleting ' + options.clean.dist);
      del(options.clean.dist, callback);
    } else {
      callback();
    }
  });

  /* Copy all resources to dist */
  function copyResources() {
    var bytes = 0,
        startTime = +new Date();
    return gulp.src([
        options.copy.src + '/**/*.*',
        '!' + options.copy.src + '/**/*.+(' + options.browserify.excludes + ')',
      ])
      .pipe($.tap(function(file, callback) {
        bytes += fs.statSync(file.path).size;
        return callback;
      }))
      .pipe(gulp.dest(options.copy.dist))
      .pipe($.concat('tmp'))
      .pipe($.tap(function() {
        var endTime = +new Date();
        log.mark('[RESOURCES] ' + bytes + ' bytes written (' + (endTime - startTime)/1000.0 + ' seconds)');
      }));
  };
  gulp.task(options.taskPrefix + 'copy-resources', copyResources);

  /* Handle single resource events for dist */
  function copyResource(evt, callback) {
    var status = evt.type,
        path = evt.path,
        relPath = pathLib.relative('./' + options.copy.src, evt.path),
        srcPath = path,
        destPath = './' + options.copy.dist;

    if (status === 'changed') {
      log.mark('[MODIFY] --> ' + relPath);
      return gulp.src(srcPath)
        .pipe($.concat(relPath))
        .pipe(gulp.dest(destPath));
    } else if (status === 'added') {
      log.mark('[ADDED] --> ' + relPath);
      return gulp.src(srcPath)
        .pipe($.concat(relPath))
        .pipe(gulp.dest(destPath));
    } else if (status === 'renamed') {
      log.mark('[RENAMED] --> ' + relPath);
      return gulp.src(srcPath)
        .pipe($.concat(relPath))
        .pipe(gulp.dest(destPath));
    } else if (status === 'deleted') {
      log.mark('[DELETED] --> ' + relPath);
      del(destPath + '/' + relPath, callback);
    }
  };

  /* Build all styles */
  function buildStyles() {
    return gulp.src(options.sass.src)
      .pipe($.sass({
        file: options.sass.root,
        includePaths: options.sass.includes,
        onSuccess: function(err) {
          log.mark('[SASS] ' + err.css.length + ' bytes written (' + (err.stats.duration / 1000.0) + ' seconds)');
        },
        onError: function(err) {
          log.error('[SASS] @ ' + currentDateTime());
          log.warn('File: [line:' + err.line + ', col:' + err.column + '] ' + err.file);
          log.warn('Message: ' + err.message);
        }
      }))
      .pipe($.autoprefixer())
      .pipe(gulp.dest(options.sass.dist))
  };
  gulp.task(options.taskPrefix + 'build-styles', buildStyles);

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
  gulp.task(options.taskPrefix + 'build-app', buildApp);

  /* Full build */
  gulp.task(options.taskPrefix + 'build', function(callback) {
    browserifyBundler = browserify(watchify.args);
    configureBrowserify(browserifyBundler);
    runSequence(options.taskPrefix + 'clean', buildTasks,
      function() {
        log.mark('[BROWSERIFY] complete!');
        callback();
      });
  });

  /* Watch build */
  gulp.task('watch', function() {
    browserifyBundler = watchify(browserify(watchify.args));
    browserifyBundler.continueOnError = true;
    configureBrowserify(browserifyBundler);
    gulp.watch(options.sass.src, buildStyles);
    gulp.watch([
      options.copy.src + '/**/*.*',
      '!' + options.copy.src + '/**/*.+(' + options.copy.excludes +')',
    ], copyResource);
    browserifyBundler.on('update', buildApp);
    browserifyBundler.on('log', function(data) {
      log.mark('[BROWSERIFY] ' + data.toString());
    });
    runSequence(options.taskPrefix + 'clean', buildTasks);
  });

  /* Returns public configuration API */
  return {
    /**
     * @method transform
     * @param transform {String or Object} either a string referencing the transform to perform or an object
     *                  can either be a string identifying the transform or an object of the format:
     *                    {name: 'name of transform', options: {// transform options}}
     */
    transform: function(transform) {
      options.browserify.transformStack.push(transform);
    },

    /**
     * @method nonResources
     * @param excludes {String} regex that defines which files to exclude from the copy-resources task.
     */
    nonResources: function(excludes) {
      options.browserify.excludes = excludes;
    },

    /**
     * @method options
     * @param newOptions {Object} <same as the options that are part of the constructor>
     */
    options: function(newOptions) {
      _.merge(options, newOptions);
    }
  };
};
