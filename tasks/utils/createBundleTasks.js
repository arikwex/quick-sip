var cleanTaskGenerator = require('../clean'),
    copyTaskGenerator = require('../copy-resources'),
    stylesTaskGenerator = require('../build-styles'),
    browserifyTaskGenerator = require('../build-app');

// Initialized stores whether a task with a particular prefix was initialized before
var initialized = {};

module.exports = function(gulp, options) {
  var tasks = {},
      taskPrefix = options.taskPrefix;
  if (!initialized[taskPrefix]) {
    tasks.copy = copyTaskGenerator(gulp, options);
    tasks.styles = stylesTaskGenerator(gulp, options);
    tasks.browserify = browserifyTaskGenerator(gulp, options);
    tasks.clean = cleanTaskGenerator(gulp, options);
    initialized[taskPrefix] = true;
  }

  return tasks;
};