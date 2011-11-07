# All the files to build...
cat src/rekapi.core.js \
  src/rekapi.actor.js \
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

cat /tmp/rekapi.compiled.js > dist/rekapi.min.js
