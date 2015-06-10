/**
 * @class CopyResourcesTask
 * @constructor
 * @param gulp {Gulp} reference to the gulp object.
 * @param [options] {Object} configuration options for the resource copy (copy-resources) task.
 *   @param [options.skip=false] {Boolean} whether to skip (true) or run (false) the copy resources task.
 *   @param [options.excludes='js|css|scss'] {String} regex of resources to exclude when copying.
 *   @param [options.src='<options.src>'] {String} src directory of resources to include in the copy
 *                                             (will have '/**//*.*' appended to it for the copy and it will exclude the excludes).
 *   @param [options.dist='<options.dist>'] {String} distribution directory to copy the resources to.
 */
module.exports = function(gulp, options) {
  var _ = require('lodash'),
      fs = require('fs'),
      del = require('del'),
      log = require('color-log'),
      gulpLoadPlugins = require('gulp-load-plugins'),
      $ = gulpLoadPlugins({}),
      defaultOptions = {
        taskPrefix: '',
        skip: false,
        excludes: 'scss',
        src: 'app',
        dist: 'dist'
      };

  options = _.merge({}, defaultOptions, options);

  function copyResources() {
    var bytes = 0,
        startTime = +new Date();
    return gulp.src([
        options.src + '/**/*.*',
        '!' + options.src + '/**/*.+(' + options.excludes + ')',
      ])
      .pipe($.tap(function(file, callback) {
        bytes += fs.statSync(file.path).size;
        return callback;
      }))
      .pipe(gulp.dest(options.dist))
      .pipe($.concat('tmp'))
      .pipe($.tap(function() {
        var endTime = +new Date();
        log.mark('[RESOURCES] ' + bytes + ' bytes written (' + (endTime - startTime)/1000.0 + ' seconds)');
      }));
  };
  gulp.task(options.taskPrefix + 'copy-resources', copyResources);

  return {
    options: function(newOptions) {
      options = _.merge({}, defaultOptions, newOptions);
    }
  }
};