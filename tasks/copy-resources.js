var $ = require('gulp-load-plugins')({}),
    fs = require('fs'),
    log = require('color-log'),
    options = require('./utils/options');

module.exports = function(gulp, newCopyOptions) {
  options.updateOptions({ copy: newCopyOptions });

  if (!options.copy.skip) {
    /* Copy all resources to dist */
    gulp.task(options.taskPrefix + 'copy-resources', function() {
      var bytes = 0,
          startTime = +new Date();
      return gulp.src([
          options.copy.src + '/**/*.*',
          '!' + options.copy.src + '/**/*.+(' + options.copy.excludes + ')',
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
    });
  }
};