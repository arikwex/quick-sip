module.exports = function(gulp) {
  var browserifyBundler, copyResources, copyResource, buildStyles, buildApp, configureBrowserify,
    transformStack = [],
    nonResources = 'js|css|scss',
    fs = require('fs'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    $ = gulpLoadPlugins({}),
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
      dist: 'dist'
    };

  /* Current date-time printer */
  var currentDateTime = function() {
    var date = new Date();
    var datetime = '';
    datetime += date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ' ';
    datetime += (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
    return datetime;
  };

  /* Relative path */
  var relativePath = function(path) {
    return path.substring(process.cwd().length + 1);
  };

  /* Browserify bundler */
  watchify.args.debug = ($.util.env.type !== 'production');
  configureBrowserify = function() {
    browserifyBundler.add('./' + paths.app + '/' + paths.scripts + '/main');
    for (var i = 0; i < transformStack.length; i++) {
      browserifyBundler.transform(transformStack[i]);
    }
  };

  /* Clean the paths.dist directory */
  gulp.task('clean', function() {
    return gulp.src(paths.dist, {read: false})
      .pipe($.rimraf());
  });

  /* Copy all resources to dist */
  copyResources = function() {
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
  copyResource = function(evt) {
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
      return gulp.src(destPath + '/' +relPath)
        .pipe($.rimraf());
    }
  };

  /* Build all styles */
  buildStyles = function() {
    return gulp.src([paths.app + '/**/*.scss'])
    .pipe($.sass({
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
  buildApp = function() {
    return browserifyBundler.bundle()
      .on('error', function(err, b) {
        delete err.stream;
        log.error('[BROWSERIFY] @ ' + currentDateTime());
        log.warn(err.toString());
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
    configureBrowserify();
    runSequence('clean',
      [
        'copy-resources',
        'build-styles',
        'build-app'
      ], function() {
        log.mark('[BROWSERIFY] complete!');
        callback();
      });
  });

  /* Watch build */
  gulp.task('watch', function() {
    browserifyBundler = watchify(browserify(watchify.args));
    configureBrowserify();
    gulp.watch(paths.app + '/' + paths.styles + '/**/*.scss', buildStyles);
    gulp.watch([
      paths.app + '/**/*.*',
      '!' + paths.app + '/**/*.+(' + nonResources +')',
    ], copyResource);
    browserifyBundler.on('update', buildApp);
    browserifyBundler.on('log', function(data) {
      log.mark('[BROWSERIFY] ' + data.toString());
    });
    runSequence('clean',
      [
        'copy-resources',
        'build-styles',
        'build-app'
      ]);
  });

  /* Returns public configuration API */
  return {
    transform: function(fn) {
      transformStack.push(fn);
    },

    nonResources: function(nrsc) {
      nonResources = nrsc;
    }
  };
};