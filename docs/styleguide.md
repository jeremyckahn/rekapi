# Rekapi source style guide

Generally speaking, Rekapi follows the [Google JavaScript style guide]
(http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml), but
with a few differences:

  * Leading commas:

````
var obj = {
  'foo': true
  ,'bar': true
}
````

  * Property names in Object literals must be in quotes, as above
  when  needed
  * Function declaration spacing uses a slightly different format:
  
  ````javascript
  function myFunction (param1, param2) {
      // Code!
  }
  ````

Things to keep in mind:

  * Always use semicolons, do not depend on Automatic Semicolon Insertion
  (ASI).
  * Lines in source and docs are limited to 80 characters
  * Use the `var` keyword for every new variable, declare variables only
  * All functions require [Google Closure-style annotations]
  (https://developers.google.com/closure/compiler/docs/js-for-compiler)
  * Favor clarity over cleverness and don't write pre-obfuscated code

Pull Requests that do not adhere to the styleguide will still be happily
accepted, but the source will be reformatted after the fact.  If you would like
to prolong your per-line attribution, it is best to stick to this style guide.
