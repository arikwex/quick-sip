var cleanTaskGenerator = require('../clean'),
    copyTaskGenerator = require('../copy-resources'),
    stylesTaskGenerator = require('../build-styles'),
    browserifyTaskGenerator = require('../build-app');

// Initialized stores whether a task with a particular prefix was initialized before
var taskCache = {};

module.exports = function(gulp, options) {
  var tasks = {},
      taskPrefix = options.taskPrefix;
  if (!taskCache[taskPrefix]) {
    tasks.copy = copyTaskGenerator(gulp, options);
    tasks.styles = stylesTaskGenerator(gulp, options);
    tasks.browserify = browserifyTaskGenerator(gulp, options);
    tasks.clean = cleanTaskGenerator(gulp, options);
    taskCache[taskPrefix] = tasks;
  }

  return taskCache[taskPrefix];
};