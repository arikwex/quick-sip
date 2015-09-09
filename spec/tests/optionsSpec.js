var generateOptions = require('../../tasks/utils/options');

describe('Options', function() {
  it('should produce a unique object every time its run', function() {
    var options1 = generateOptions(),
        options2 = generateOptions();

    options1.foo = 'bar';
    expect(options2.bar).toBeUndefined();
  });

  it('when given no arguments should produce default options', function() {
    var options = generateOptions();

    expect(options.dist).toBe('dist');
    expect(options.clean.dist).toBe('dist');
  });

  describe('.update', function() {
    var testDistValue = 'testValue';

    beforeEach(function() {
      this.defaultOptions = generateOptions();
    });


    it('should be able to update base defaults', function() {
      var options = this.defaultOptions.update({dist: testDistValue});

      expect(options.dist).toBe(testDistValue);
    });

    it('should be able to update bundle options', function() {
      var options = this.defaultOptions.update({
            clean: {
              dist: testDistValue
            }
          });

      expect(options.clean.dist).toBe(testDistValue);
    });

    it('if bundle option is not defined, should default to base option', function() {
      var options = this.defaultOptions.update({
        dist: testDistValue
      });

      expect(options.clean.dist).toBe(testDistValue);
    });

    it('should use the base default value for bundle options when the bundle option is not specified by the user', function() {
      var options = this.defaultOptions.update({
          browserify: {
            transforms: [
              {transform: 'aliasify', options: {global: true}},
              'hbsfy'
            ]
          }
      });

      expect(options.src).toBeDefined();
      expect(options.src).toBe('app');
      expect(options.browserify.root).toBe('./app/app');

    });
  });
});