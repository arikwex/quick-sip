/**
 * @class CopyResourcesTask
 * @constructor
 *  @param [options] {Object} configuration options for the styles (build-styles) task.
 *    @param [options.skip=false] {Boolean} whether to skip (true) or run (false) the styles task.
 *    @param [options.src='<options.src>/**//*.scss'] {String} all styles source files to include.
 *    @param [options.root='<options.src>/app'] {String} the root styles file to bundle.
 *    @param [options.includes=[]] {String[]} additional styles paths to include.
 *    @param [options.dist='<options.dist>'] {String} the location of the location of the resulting .css file.
 */
module.exports = function(gulp, options) {
  var _ = require('lodash'),
      gulpLoadPlugins = require('gulp-load-plugins'),
      $ = gulpLoadPlugins({}),
      log = require('color-log'),
      currentDateTime = require('../currentDateTime'),
      defaultOptions = {
        skip: false,
        root: 'app/app.scss',
        includes: [],
        dist: 'dist'
      };

  options = _.merge({}, defaultOptions, options);

  function buildStyles() {
    return gulp.src(options.root)
      .pipe($.sass({
        file: options.root,
        includePaths: options.includes,
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
      .pipe(gulp.dest(options.dist))
  };
  gulp.task(options.taskPrefix + 'build-styles', buildStyles);

  return {
    options: function(newOptions) {
      options = _.merge({}, defaultOptions, newOptions);
    }
  }
};