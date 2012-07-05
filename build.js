// This script is inspired by the build script for Shifty, which was written by
// Miller Medeiros.

// --- SETTINGS --- //

var
  DIST_NAME = 'rekapi',
  DIST_FOLDER = 'dist',
  replacements = {
    'version' : null,
    'build_date' : (new Date()).toGMTString()
  },
  HEAD_FILE_LIST = [
    'src/rekapi.license.js',
    'src/rekapi.intro.js'],
  CORE_FILE_LIST = [
    'src/rekapi.core.js',
    'src/rekapi.actor.js',
    'src/rekapi.keyframeprops.js'],
  TAIL_FILE_LIST = [
    'src/rekapi.init.js',
    'src/rekapi.outro.js'],
  EXTENSION_FILE_LIST = [
    'ext/canvas/rekapi.canvas.context.js',
    'ext/canvas/rekapi.canvas.actor.js',
    'ext/dom/rekapi.dom.actor.js',
    'ext/to-css/rekapi.to-css.js'];


// --- SETUP --- //

var
  _cli = require('commander'),
  _fs = require('fs'),
  _path = require('path'),
  _exec = require('child_process').exec,
  _distBaseName = _path.join(__dirname, DIST_FOLDER, DIST_NAME),
  _distFileName = _distBaseName + '.js',
  _distFileNameMin = _distBaseName + '.min.js';
  _distBundleName = _distBaseName + '.bundle.min.js';

_cli
  .version('0.1.2')
  .option('--ver <build version>',
      'A string representing the semver build version to record in the source (eg. 5.0.2)')
  .option('--noext',
      'Don\'t include optional extensions (such as DOM and Canvas renderers)')
  .parse(process.argv);


// --- HELPERS --- //

/**
 * Parse string and replace tokens delimited with '{{}}' with object data.
 * @param {string} template String containing {{tokens}}.
 * @param {object} data Object containing replacement values.
 */
function stache(template, data){
  function replaceFn(match, prop){
      return (prop in data)? data[prop] : '';
  }
  return template.replace(/\{\{(\w+)\}\}/g, replaceFn);
}


function contains(arr, val) {
  return arr.indexOf(val) !== -1;
}


function echoFileSize(filename, explanatoryString) {
  //should be called only after minification completed
  _exec(
    'cat '+ filename +' | gzip -9f | wc -c',
    function (error, stdout, stderr) {
      if (error) {
        console.log(stderr);
      } else {
        console.log(explanatoryString);
        console.log('   The file size, minified and gzipped, is: '
          + (stdout + '').replace(/[\s\n]/g, '') + ' bytes.');
      }
    }
  );
}


// ---  CONCAT --- //

function getFileList() {
  var files = HEAD_FILE_LIST.slice(0);
  files = files.concat(CORE_FILE_LIST);

  if (!_cli.noext) {
    files = files.concat(EXTENSION_FILE_LIST);
  }

  files = files.concat(TAIL_FILE_LIST);

  return files;
}

function concatFiles(fileList) {
  var out = fileList.map(function(filePath){
    return _fs.readFileSync(filePath);
  });
  return out.join('');
}

if (! _cli.ver ) {
  console.log('   ERROR: Please provide a version number (with "--ver").');
  process.exit(1); //exit with error
}

replacements.version = _cli.ver;
_fs.writeFileSync(_distFileName,
    stache(concatFiles(getFileList()), replacements));


// --- MINIFICATION ---- //

function getLicense(){
  var srcLicense = _fs.readFileSync('src/rekapi.license.js', 'utf-8');
  return stache(srcLicense, replacements);
}

var
  uglifyJS = require('uglify-js'),
  jsp = uglifyJS.parser,
  pro = uglifyJS.uglify,
  ast = jsp.parse( _fs.readFileSync(_distFileName, 'utf-8') );

ast = pro.ast_mangle(ast, {
    'defines': {
      KAPI_DEBUG: ['name', 'false']
    }
  });
ast = pro.ast_squeeze(ast);

_fs.writeFileSync(_distFileNameMin, getLicense() + pro.gen_code(ast) );

echoFileSize(_distFileNameMin, '   Yay!  Rekapi was built.');


// --- VERSIONING --- //

_exec('echo ' + replacements.version + ' > version.txt');


// -- MISCELLANEOUS FILE OPS -- //
_exec('cp lib/underscore/_.min.js dist/_.js');
_exec('cp lib/shifty/dist/shifty.min.js dist/shifty.js');

var underscoreCode = _fs.readFileSync('./lib/underscore/_.min.js', 'utf-8');
var shiftyCode = _fs.readFileSync('./lib/shifty/dist/shifty.min.js', 'utf-8');
var rekapiCode = _fs.readFileSync('./dist/rekapi.min.js', 'utf-8');
var bin = [underscoreCode, shiftyCode, rekapiCode].join(';');

_fs.writeFileSync(_distBundleName, getLicense() + bin );
echoFileSize(_distBundleName, '\n   Joy!  The bundle file (Underscore + Shifty + Rekapi) was created.');
