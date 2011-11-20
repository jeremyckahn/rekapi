# Call this script like this:
# $: sh build.sh versionNumber

echo \
"/**
 * Rekapi - Rewritten Kapi. v${1}
 *   By Jeremy Kahn - jeremyckahn@gmail.com
 *   https://github.com/jeremyckahn/rekapi
 *
 * Make fun keyframe animations with JavaScript.
 * Dependencies: Underscore.js (https://github.com/documentcloud/underscore), Shifty.js (https://github.com/jeremyckahn/shifty)
 * MIT Lincense.  This code free to use, modify, distribute and enjoy.
 */" | cat > /tmp/rekapi.header.js

cat /tmp/rekapi.header.js \
  src/rekapi.core.js \
  src/rekapi.actor.js \
  src/rekapi.dom.js \
  src/rekapi.canvas.js \
  src/rekapi.interpolate.js \
  > dist/rekapi.js

in=dist/rekapi.js
out=/tmp/rekapi.compiled.js

curl -s \
  -d compilation_level=SIMPLE_OPTIMIZATIONS \
  -d output_format=text \
  -d output_info=compiled_code \
  --data-urlencode "js_code@${in}" \
  http://closure-compiler.appspot.com/compile \
   > $out

cat /tmp/rekapi.header.js /tmp/rekapi.compiled.js > dist/rekapi.min.js
cp lib/underscore/underscore-min.js dist/underscore.js
cp lib/shifty/builds/shifty.min.js dist/shifty.js

echo 'Yay!  Rekapi was built.  The file size, minified and gzipped, is:'
echo `cat dist/rekapi.min.js | gzip -9f | wc -c` "bytes"
