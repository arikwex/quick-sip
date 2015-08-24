var buildTaskGenerator = require('./tasks/build'),
    watchTaskGenerator = require('./tasks/watch'),
    generateOptions = require('./tasks/utils/options');

module.exports = function(gulp, bundleOptions) {
  var defaultOptions = generateOptions(),
      options = defaultOptions.update(bundleOptions);
  buildTaskGenerator(gulp, options);
  watchTaskGenerator(gulp, options);
};
