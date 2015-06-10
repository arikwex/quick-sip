/**
 * @class Quick-Sip
 * @constructor
 * @param gulp {Gulp} reference to the gulp object.
 * @param options {Object} configuration options for the build task.
 *  @param options.transformStack {String[]} array of transforms to apply during the browserify process
 *  @param options.rootJS {String} path (relative or absolute) to the main .js file to start bundling.
 *  @param options.dist {String} path (relative or absolute) to where you want the distribution.
 *  @param options.skipScss {Boolean} whether to skip compiling the styles.
 *  @param options.skipCopyResources {Boolean} whether to skip the copy resources step.
 *  @param options.failOnError {Boolean} whether failures during the browserify process should error the build or continue.
 */
module.exports = function(gulp, options) {
  options = options || {};
  var browserifyBundler,
    failOnError = options.failOnError || false,
    transformStack = options.transformStack || [],
    nonResources = options.nonResources || 'js|css|scss',
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
    runSequence = require('run-sequence').use(gulp),
    paths = {
      app: 'app',
      scripts: 'scripts',
      styles: 'styles',
      templates: 'scripts/**/templates',
      dist: 'dist',
      rootJs: options.rootJS || 'main',
      rootScss: options.rootScss || 'app'
    },
    buildTasks = [
      'build-app'
    ];

  if (!options.skipCopyResources) {
    buildTasks.push('copy-resources');
  }

  if (!options.skipScss) {
    buildTasks.push('build-styles');
  }

  function defaultPath(path, defaultPath) {
    if (path && path[0] === '.' || path[0] === '/') {
      return path;
    }
    return defaultPath + path;
  };

  /* Current date-time printer */
  function currentDateTime() {
    var date = new Date(),
        datetime = '';
    datetime += date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ' ';
    datetime += (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
    return datetime;
  };

  /* Browserify bundler */
  watchify.args.debug = ($.util.env.type !== 'production');
  function configureBrowserify(browserifyBundler) {
    var transformStackIndex;
    browserifyBundler.add(defaultPath(paths.rootJs, './' + paths.app + '/' + paths.scripts + '/'));
    for (transformStackIndex = 0; transformStackIndex < transformStack.length; transformStackIndex++) {
      browserifyBundler.transform(transformStack[transformStackIndex]);
    }
  };

  /* Clean the paths.dist directory */
  gulp.task('clean', function(callback) {
    log.mark('[CLEAN] deleting ' + paths.dist);
    del(paths.dist, callback);
  });

  /* Copy all resources to dist */
  function copyResources() {
    var bytes = 0;
    var startTime = +new Date();
    return gulp.src([
        paths.app + '/**/*.*',
        '!' + paths.app + '/**/*.+(' + nonResources + ')',
      ])
      .pipe($.tap(function(file, callback) {
        bytes += fs.statSync(file.path).size;
        return callback;
      }))
      .pipe(gulp.dest(paths.dist))
      .pipe($.concat('tmp'))
      .pipe($.tap(function() {
        var endTime = +new Date();
        log.mark('[RESOURCES] ' + bytes + ' bytes written (' + (endTime - startTime)/1000.0 + ' seconds)');
      }));
  };
  gulp.task('copy-resources', copyResources);

  /* Handle single resource events for dist */
  function copyResource(evt, callback) {
    var status = evt.type;
    var path = evt.path;
    var relPath = pathLib.relative('./app', evt.path);
    var srcPath = path;
    var destPath = './' + paths.dist;

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
    return gulp.src([paths.app + '/**/*.scss'])
    .pipe($.sass({
      file: defaultPath(paths.rootScss, paths.app),
      includePaths: [],
      onSuccess: function(err) {
        log.mark('[SASS] ' + err.css.length + ' bytes written (' + (err.stats.duration / 1000.0) + ' seconds)');
      },
      onError: function(err) {
        log.error('[SASS] @ ' + currentDateTime());
        log.warn('File: [line:' + err.line + ', col:' + err.column + '] ' + err.file);
        log.warn('Message: ' + err.message);
      }
    }))
    .pipe(gulp.dest(paths.dist))
  };
  gulp.task('build-styles', buildStyles);

  /* Reduce all javascript to app.js */
  function buildApp() {
    return browserifyBundler.bundle()
      .on('error', function(err) {
        delete err.stream;
        log.error('[BROWSERIFY] @ ' + currentDateTime());
        log.warn(err.toString());
        if (!browserifyBundler.continueOnError && failOnError) {
          throw err;
        }
        return true;
      })
      .pipe(source('app.js'))
      .pipe(buffer())
      .pipe($.util.env.type !== 'production' ? $.sourcemaps.init({loadMaps: true}) : $.util.noop())
      .pipe($.util.env.type === 'production' ? $.uglify() : $.util.noop())
      .pipe($.util.env.type !== 'production' ? $.sourcemaps.write('./') : $.util.noop())
      .pipe(gulp.dest(paths.dist + '/' + paths.scripts));
  };
  gulp.task('build-app', buildApp);

  /* Full build */
  gulp.task('build', function(callback) {
    browserifyBundler = browserify(watchify.args);
    configureBrowserify(browserifyBundler);
    runSequence('clean', buildTasks,
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
    gulp.watch(paths.app + '/' + paths.styles + '/**/*.scss', buildStyles);
    gulp.watch([
      paths.app + '/**/*.*',
      '!' + paths.app + '/**/*.+(' + nonResources +')',
    ], copyResource);
    browserifyBundler.on('update', buildApp);
    browserifyBundler.on('log', function(data) {
      log.mark('[BROWSERIFY] ' + data.toString());
    });
    runSequence('clean', buildTasks);
  });

  /* Returns public configuration API */
  return {
    transform: function(fn) {
      transformStack.push(fn);
    },

    nonResources: function(nrsc) {
      nonResources = nrsc;
    },

    setRootJS: function(rootJs) {
      paths.rootJs = rootJs;
    },

    setRootSCSS: function(rootScss) {
      paths.rootScss = rootScss;
    },

    setDist: function(dist) {
      paths.dist = dist;
    },

    setNoScss: function() {
      var buildStylesIndex = buildTasks.indexOf('build-styles');
      if (buildStylesIndex > -1) {
        buildTasks.splice(buildStylesIndex, 1);
      }
    },

    setNoCopyResources: function() {
      var copyResourcesIndex = buildTasks.indexOf('copy-resources');
      if (copyResourcesIndex > -1) {
        buildTasks.splice(copyResourcesIndex, 1);
      }
    },

    setFailOnError: function() {
      failOnError = true;
    }
  };
};