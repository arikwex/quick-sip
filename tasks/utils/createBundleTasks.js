var cleanTaskGenerator = require('../clean'),
    copyTaskGenerator = require('../copy-resources'),
    stylesTaskGenerator = require('../build-styles'),
    browserifyTaskGenerator = require('../build-app');

var initialized = false,
    tasks = {};

module.exports = function(gulp) {
  if (!initialized) {
    tasks.copy = copyTaskGenerator(gulp);
    tasks.styles = stylesTaskGenerator(gulp);
    tasks.browserify = browserifyTaskGenerator(gulp);
    tasks.clean = cleanTaskGenerator(gulp);
    initialized = true;
  }

  return tasks;
}