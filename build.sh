#!/bin/bash

# Call this script like this:
# $: sh build.sh version_number [local_path_to_compiler]

echo \
"/*jslint browser: true, nomen: true, plusplus: true, undef: true, vars: true, white: true */
/**
 * Rekapi - Rewritten Kapi. v${1}
 * https://github.com/jeremyckahn/rekapi
 *
 * By Jeremy Kahn (jeremyckahn@gmail.com), with significant contributions from
 *   Franck Lecollinet
 *
 * Make fun keyframe animations with JavaScript.
 * Dependencies: Underscore.js (https://github.com/documentcloud/underscore),
 *   Shifty.js (https://github.com/jeremyckahn/shifty).
 * MIT Lincense.  This code free to use, modify, distribute and enjoy.
 */" | cat > /tmp/rekapi.header.js

echo \
";(function(global) {
" | cat > /tmp/rekapi.iife-open.js

echo \
"} (this));" | cat > /tmp/rekapi.iife-close.js

cat /tmp/rekapi.header.js \
  /tmp/rekapi.iife-open.js \
  src/rekapi.core.js \
  src/rekapi.actor.js \
  src/rekapi.keyframeprops.js \
  ext/canvas/rekapi.canvas.context.js \
  ext/canvas/rekapi.canvas.actor.js \
  ext/dom/rekapi.dom.actor.js \
  ext/to-css/rekapi.to-css.js \
  src/rekapi.init.js \
  /tmp/rekapi.iife-close.js \
  > dist/rekapi.js

in=dist/rekapi.js
out=/tmp/rekapi.compiled.js

# If a local path to the Closure compiler was specified, use that.
if [ $2 ]; then
  java -jar ${2} --js=$in --js_output_file=$out
else
  # Otherwise curl out to Google's.
  curl -s \
    -d compilation_level=SIMPLE_OPTIMIZATIONS \
    -d output_format=text \
    -d output_info=compiled_code \
    --data-urlencode "js_code@${in}" \
    http://closure-compiler.appspot.com/compile \
     > $out
fi

cat /tmp/rekapi.header.js /tmp/rekapi.compiled.js > dist/rekapi.min.js
cp lib/underscore/underscore-min.js dist/underscore.js
cp lib/shifty/dist/shifty.min.js dist/shifty.js

cat /tmp/rekapi.header.js > dist/rekapi.bundle.min.js
cat dist/underscore.js >> dist/rekapi.bundle.min.js

# Semicolon insertions fix bizarre Closure bugs.  They separate the libraries.
echo ";" >> dist/rekapi.bundle.min.js
cat dist/shifty.js >> dist/rekapi.bundle.min.js
echo ";" >> dist/rekapi.bundle.min.js
cat dist/rekapi.min.js >> dist/rekapi.bundle.min.js

echo 'Yay!  Rekapi was built.  The file size, minified and gzipped, is:'
echo `cat dist/rekapi.min.js | gzip -9f | wc -c` "bytes"

echo ${1} > version.txt
