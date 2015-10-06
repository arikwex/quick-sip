var del = require('del'),
    log = require('color-log');

module.exports = function(gulp, options) {

  if (!options.clean.skip) {
    /* Clean the options.clean.dist directory */
    gulp.task(options.taskPrefix + 'clean', function(callback) {
      log.mark('[CLEAN] deleting ' + options.clean.dist);
      del(options.clean.dist, options.clean).then(function() {
        callback();
      });
    });
  }
};
