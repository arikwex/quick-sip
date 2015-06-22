# quick-sip
Gulp build process tasks that provide watchify and sass compilation.

## Project Layout
Here is an example project hierarchy that will work with the default settings:

```
project
  |-- package.json
  |-- gulpfile.js
  |-- app
       |-- app.js
       |-- app.scss
       |
       |-- scripts
       |      |-- chairModel.js
       |      |-- chairView.js
       |
       |-- styles
       |      |-- _chair.scss
       |      |-- _engraved.scss
       |
       |-- index.html
```

After running the build task, a "dist" directory will be created:
```
project
   | ...
   |-- dist
        |-- app.js
        |-- app.scss
        |
        |-- index.html
```
**app.js** is the browserified application that app.js completely specifies.
**core.css & whatever.css** are the sass-lib compiled css files.

## Executing Tasks
Your **gulpfile.js** only needs the following to give you access to the build tasks:
```javascript
var gulp = require('gulp');
var buildProcess = require('quick-sip')(gulp);
```

The gulp tasks you care about are:
- **clean** - Remove the contents of the dist directory
- **build** - Builds the whole application; js, css, and resources.
- **watch** - Sets up watchify for your js, listens for scss changes, and handles other resource changes.
- **copy-resources** - Only copy the resources to dist (non-js and non-scss by default)
- **build-styles** - Only builds the styles to dist
- **build-app** - Only builds the javascript to dist

## Transforming Browserify
Easy!
```javascript
var gulp = require('gulp');
var buildProcess = require('quick-sip')(gulp, {
  browserify: {
    transforms: [
      { transform: 'aliasify', options: { global: true } },
      'hbsfy',
      yourCustomThroughTransform
    ]
  }
});
```

## Defining Resource Exclusion Extensions
Easy!
```javascript
var gulp = require('gulp');
var buildProcess = require('quick-sip')(gulp, {
  copy: {
    excludes: 'js|css|scss|hbs|frag|vert'
  }
});
```

## Configuration Details
The configurations are specified as an optional property when creating the build processes.
```javascript
var gulp = require('gulp');
var buildProcess = require('quick-sip')(gulp, options);
```
### Options
The options are grouped by task with some top level defaults.  The defaults are also slightly different depending on if you are configuring a task directly vs. through the aggregate build generator.
#### taskPrefix
