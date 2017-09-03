# Contributing to Rekapi

First of all, thanks!  Community contribution is what makes open source great.
If you find a bug or would like to make a feature request, please report it on
the [issue tracker](https://github.com/jeremyckahn/rekapi/issues).  If you
would like to make changes to the code yourself, read on!

## Getting started

To get started with working on Rekapi, you'll need to get all of the
dependencies:

```
$: npm install
```

## Pull Requests and branches

The project maintainer ([@jeremyckahn](https://github.com/jeremyckahn)) manages
releases.  `master` contains the latest stable code, and `develop` contains
commits that are ahead of (newer than) `master` that have yet to be officially
released (built and tagged).  *When making a Pull Request, please branch off of
`develop` and request to merge back into it.*  `master` is only merged into
from `develop`.

## Building

```
$: npm run build
```

A note about the `dist/` directory:  You should not modify the files in this
directory manually, as your changes will be overwritten by the build process.
The Rekapi source files are in the `src/` directory.

## Testing

Please make sure that all tests pass before submitting a Pull Request.  To run
the tests on the command line:

```
$: npm run test
```

## Style

Please try to remain consitent with existing code.  To automatically check for
style issues or other potential problems, you can run:

```
$: npm run lint
```
