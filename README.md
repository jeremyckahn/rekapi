# Rekapi - Keyframes for JavaScript

Rekapi is a keyframe animation library for JavaScript.  It gives you an API
for:

* Defining keyframe-based animations
* Controlling animation playback

Rekapi is renderer-agnostic.  At its core, Rekapi does not perform any
rendering.  However, it does expose an API for defining renderers, and comes
bundled with renderers for the HTML DOM and HTML5 2D `<canvas>`.

## Browser compatibility

Rekapi officially supports Evergreen browsers.

## Installation

```
npm install --save rekapi
```

## Developing Rekapi

First, install the dependencies via npm like so:

```
npm install
```

Once those are installed, you can generate `dist/rekapi.js` with:

```
npm run build
```

To run the tests in CLI:

```
npm test
```

To generate the documentation (`dist/doc`):

```
npm run doc
```

To generate, live-update, and view the documentation in your browser:

```
npm run doc:live
```

To start a development server:

```
npm start
```

Once that's running, you can run the tests at http://localhost:9010/test/ and
view the documentation at http://localhost:9010/dist/doc/.

## Loading Rekapi

Rekapi exposes a UMD module, so you can load it however you like:

```javascript
// ES6
import { Rekapi, Actor } from 'rekapi';
```

Or:

```javascript
// AMD
define(['rekapi'], rekapi => { });
```

Or even:

```javascript
// CommonJS
const rekapi = require('rekapi');
```

## Contributors

Take a peek at the [Network](https://github.com/jeremyckahn/rekapi/network)
page to see all of the Rekapi contributors.

## License

Rekapi is distributed under the [MIT
license](http://opensource.org/licenses/MIT).  You are encouraged to use and
modify the code to suit your needs, as well as redistribute it.
