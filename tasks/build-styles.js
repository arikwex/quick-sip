var $ = require('gulp-load-plugins')({}),
    log = require('color-log'),
    currentDateTime = require('./utils/currentDateTime');

module.exports = function(gulp, options) {

  if (!options.styles.skip) {
    /* Build all styles */
    gulp.task(options.taskPrefix + 'build-styles', function() {
      return gulp.src(options.styles.root)
        .pipe($.sass({
          file: options.styles.root,
          includePaths: options.styles.includes
        })
          .on('data', function(data) {
            log.mark('[SASS] ' + data.contents.length + ' bytes written');
          })
          .on('error', function(err) {
            log.error('[SASS] @ ' + currentDateTime());
            log.warn('File: [line:' + err.line + ', col:' + err.column + '] ' + err.file);
            log.warn('Message: ' + err.message);
            this.emit('end');
          }))
        .pipe($.autoprefixer())
        .pipe(gulp.dest(options.styles.dist));
    });
  }
};