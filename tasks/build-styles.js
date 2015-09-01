var $ = require('gulp-load-plugins')({}),
    log = require('color-log'),
    currentDateTime = require('./utils/currentDateTime'),
    options = require('./utils/options');

module.exports = function(gulp, newStylesOptions) {
  options.updateOptions(newStylesOptions);

  if (!options.styles.skip) {
    /* Build all styles */
    gulp.task(options.taskPrefix + 'build-styles', function() {
      return gulp.src(options.styles.root)
        .pipe($.sass({
          includePaths: options.styles.includes,
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
        .pipe(gulp.dest(options.styles.dist));
    });
  }
};