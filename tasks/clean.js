/**
 * @class CleanTask
 * @constructor
 * @param gulp {Gulp} reference to the gulp object.
 * @param [options] {Object} configuration options for the clean build task.
 *  @param [options.taskPrefix=''] {String} prefix to use for all task names.
 *  @param [options.skip=false] {Boolean} false - run the clean task during the 'build' task.  true - skip the clean task.
 *  @param [options.dist='<options.dist>'] {String} directory to rm when running the clean task.
 */
module.exports = function(gulp, options) {
  var _ = require('lodash'),
      del = require('del'),
      log = require('color-log'),
      defaultOptions = {
        taskPrefix: '',
        skip: false,
        dist: 'dist'
      };

  options = _.merge({}, defaultOptions, options);

  /* Clean the options.dist directory */
  gulp.task(options.taskPrefix + 'clean', function(callback) {
    if (!options.skip) {
      log.mark('[CLEAN] deleting ' + options.dist);
      del(options.dist, callback);
    } else {
      callback();
    }
  });

  return {
    options: function(newOptions) {
      options = _.merge({}, defaultOptions, newOptions);
    }
  }
};