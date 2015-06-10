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
 *  @param [options.styles] {Object} configuration options for the styles (build-styles) task.
 *    @param [options.styles.skip=false] {Boolean} whether to skip (true) or run (false) the styles task.
 *    @param [options.styles.src='<options.src>/**//*.scss'] {String} all styles source files to include.
 *    @param [options.styles.root='<options.src>/app'] {String} the root styles file to bundle.
 *    @param [options.styles.includes=[]] {String[]} additional styles paths to include.
 *    @param [options.styles.dist='<options.dist>'] {String} the location of the location of the resulting .css file.
 *  @param [options.copy] {Object} configuration options for the resource copy (copy-resources) task.
 *    @param [options.copy.skip=false] {Boolean} whether to skip (true) or run (false) the copy resources task.
 *    @param [options.copy.excludes='js|css|scss'] {String} regex of resources to exclude when copying.
 *    @param [options.copy.src='<options.src>'] {String} src directory of resources to include in the copy
 *                                              (will have '/**//*.*' appended to it for the copy and it will exclude the excludes).
 *    @param [options.copy.dist='<options.dist>'] {String} distribution directory to copy the resources to.
 */
module.exports = function(gulp, options) {
  var _ = require('lodash'),
      gulpLoadPlugins = require('gulp-load-plugins'),
      $ = gulpLoadPlugins({}),
      del = require('del'),
      log = require('color-log'),
      pathLib = require('path'),
      runSequence = require('run-sequence').use(gulp),
      cleanTaskGenerator = require('./tasks/clean'),
      copyTaskGenerator = require('./tasks/copy-resources'),
      stylesTaskGenerator = require('./tasks/build-styles'),
      browserifyTaskGenerator = require('./tasks/build-app'),
      currentDateTime = require('./currentDateTime');

  // Properties used in the defaults below.
  options = _.merge({
    taskPrefix: '',
    src: 'app',
    dist: 'dist',
    clean: {}, // see defaults in ./tasks/clean.js - only included here for the skips below.
    browserify: {}, // see defaults in ./tasks/build-app.js - only included here for the skips below.
    styles: {}, // see defaults in ./tasks/build-styles.js - only included here for the skips below.
    copy: {} // see defaults in ./tasks/copy-resources.js - only included here for the skips below.
  }, options);

  var derivedDefaultCleanOptions = {
        taskPrefix: options.taskPrefix,
        dist: options.dist
      },
      derivedDefaultBrowserifyOptions = {
        taskPrefix: options.taskPrefix,
        root: './' + options.src + '/app',
        dist: options.dist
      },
      derivedDefaultStylesOptions = {
        taskPrefix: options.taskPrefix,
        root: options.src + '/app.scss',
        dist: options.dist
      },
      derivedDefaultCopyOptions = {
        taskPrefix: options.taskPrefix,
        src: options.src,
        excludes: 'js|scss',
        dist: options.dist
      },
      cleanOptions, browserifyOptions, stylesOptions, copyOptions,
      cleanTask, browserifyTask, stylesTask, copyTask,
      buildTasks = [];

  if (!options.copy.skip) {
    buildTasks.push(options.taskPrefix + 'copy-resources');

    /* Copy all resources to dist */
    copyOptions = _.merge({}, derivedDefaultCopyOptions, options.copy);
    copyTask = copyTaskGenerator(gulp, copyOptions);
  }

  if (!options.styles.skip) {
    buildTasks.push(options.taskPrefix + 'build-styles');

    /* Build all styles */
    stylesOptions = _.merge({}, derivedDefaultStylesOptions, options.styles);
    stylesTask = stylesTaskGenerator(gulp, stylesOptions);
  }

  if (!options.browserify.skip) {
    buildTasks.push(options.taskPrefix + 'build-app');

    /* Reduce all javascript to app.js */
    browserifyOptions = _.merge({}, derivedDefaultBrowserifyOptions, options.browserify);
    browserifyTask = browserifyTaskGenerator(gulp, browserifyOptions);
  }

  if (!options.clean.skip) {
    /* Clean the options.clean.dist directory */
    cleanOptions = _.merge({}, derivedDefaultCleanOptions, options.clean);
    cleanTask = cleanTaskGenerator(gulp, cleanOptions);
  }

  /* Full build */
  gulp.task(options.taskPrefix + 'build', function(callback) {
    var browserifyCompleteFn = function() {
          log.mark('[BROWSERIFY] complete!');
          callback();
        };

    if (!options.browserify.skip) {
      browserifyTask.createBundler();
    }

    if (options.clean.skip) {
      runSequence(buildTasks, browserifyCompleteFn);
    } else {
      runSequence(options.taskPrefix + 'clean', buildTasks, browserifyCompleteFn);
    }
  });
  // Alias default to do the build.  After this file is run the default task can be overridden if desired.
  gulp.task('default', ['build']);

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
  };

  /* Watch build */
  gulp.task('watch', function() {
    if (!options.styles.skip) {
      gulp.watch(options.styles.src, ['build-styles']);
    }

    if (!options.copy.skip) {
      gulp.watch([
        options.copy.src + '/**/*.*',
        '!' + options.copy.src + '/**/*.+(' + options.copy.excludes +')',
      ], copyResource);
    }

    if (!options.browserify.skip) {
      browserifyTask.createWatchifyBundler();
    }

    if (options.clean.skip) {
      runSequence(buildTasks);
    } else {
      runSequence(options.taskPrefix + 'clean', buildTasks);
    }
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
      browserifyTask.options(_.merge({}, derivedDefaultBrowserifyOptions, options.browserify));
    },

    /**
     * @method nonResources
     * @param excludes {String} regex that defines which files to exclude from the copy-resources task.
     */
    nonResources: function(excludes) {
      options.browserify.excludes = excludes;
      browserifyTask.options(_.merge({}, derivedDefaultBrowserifyOptions, options.browserify));
    },

    /**
     * @method options
     * @param newOptions {Object} <same as the options that are part of the constructor>
     */
    options: function(newOptions) {
      _.merge(options, newOptions);
      copyTask.options(_.merge({}, derivedDefaultCopyOptions, options.copy));
      browserifyTask.options(_.merge({}, derivedDefaultBrowserifyOptions, options.browserify));
      stylesTask.options(_.merge({}, derivedDefaultStylesOptions, options.styles));
      cleanTask.options(_.merge({}, derivedDefaultCleanOptions, options.clean));
    }
  };
};
