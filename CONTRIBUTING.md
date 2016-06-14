# Contributing to Rekapi

First of all, thanks!  Community contribution is what makes open source great.
If you find a bug or would like to make a feature request, please report it on
the [issue tracker](https://github.com/jeremyckahn/rekapi/issues).  If you
would like to make changes to the code yourself, read on!

## Getting started

To get started with hacking on Rekapi, you'll need to get all of the
dependencies with [Bower](http://bower.io/) (version 1.0 or later) and
[npm](https://npmjs.org/) (and, by extension, [Node](http://nodejs.org/)):

````
$: bower install; npm install
````

## Branches

Development takes place in the `develop` branch.  If you would like to make any
changes, please create a new branch based off of `develop` and target any Pull
Requests into that.

## Versioning

Rekapi uses [SemVer](http://semver.org/) for versioning.  If you modify the
source code, please adhere to this convention (in all likelihood you will only
need to modify the rightmost digit by one).  To change the version, you'll need
to update the version in two places: `bower.json` and `package.json` (look for
the lines that say `version`).  The version numbers in these two files must be
kept in sync.

## Building

````
$: npm run build
````

A note about the `dist/` directory:  You should not modify the files in this
directory manually, as your changes will be overwritten by the build process.
The Rekapi source files are in `src/` and the various `ext/` extension
directories.

## Testing

Please make sure that all tests pass before submitting a Pull Request.  To run
the tests on the command line (requires [PhantomJS](http://phantomjs.org/)):

````
$: npm run test
````

You can also run the tests in the browser.  They are in `tests/`.  If you are
adding a feature or fixing a bug, please add a test!

## Style

Please adhere to the [style guide](docs/styleguide.md).  To automatically check
for style issues or other potential problems, you can run:

````
$: npm run lint
````
