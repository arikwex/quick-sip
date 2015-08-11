var buildTaskGenerator = require('./tasks/build'),
    watchTaskGenerator = require('./tasks/watch');

module.exports = function(gulp, bundleOptions) {
  buildTaskGenerator(gulp, bundleOptions);
  watchTaskGenerator(gulp, bundleOptions);
};
