var del = require('del'),
    log = require('color-log'),
    options = require('./utils/options');

module.exports = function(gulp, newCleanOptions) {
  options.updateOptions({ clean: newCleanOptions });

  if (!options.clean.skip) {
    /* Clean the options.clean.dist directory */
    gulp.task(options.taskPrefix + 'clean', function(callback) {
      if (!options.clean.skip) {
        log.mark('[CLEAN] deleting ' + options.clean.dist);
        del(options.clean.dist, callback);
      } else {
        callback();
      }
    });
  }
};