var $ = require('gulp-load-plugins')({}),
    del = require('del'),
    log = require('color-log'),
    pathLib = require('path'),
    runSequenceGenerator = require('run-sequence'),
    createBundleTasks = require('./utils/createBundleTasks');

module.exports = function(gulp, options) {
  var tasks;

  tasks = createBundleTasks(gulp, options);

  /* Handle single resource events for watch */
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
  }

  /* Watch build */
  gulp.task(options.taskPrefix + 'watch', function() {
    var runSequence = runSequenceGenerator.use(gulp),
        buildTasks = [];

    if (!options.styles.skip) {
      buildTasks.push(options.taskPrefix + 'build-styles');
      gulp.watch(options.styles.src, ['build-styles']);
    }

    if (!options.copy.skip) {
      buildTasks.push(options.taskPrefix + 'copy-resources');
      gulp.watch([
        options.copy.src + '/**/*.*',
        '!' + options.copy.src + '/**/*.+(' + options.copy.excludes +')',
      ], copyResource);
    }

    if (!options.browserify.skip) {
      buildTasks.push(options.taskPrefix + 'build-app');
      tasks.browserify.createWatchifyBundler();
    }

    if (options.clean.skip) {
      runSequence(buildTasks);
    } else {
      runSequence(options.taskPrefix + 'clean', buildTasks);
    }
  });
};