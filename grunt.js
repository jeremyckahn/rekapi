/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner: [
        '/*! <%= pkg.name %> - v<%= pkg.version %> - ',
        '<%= grunt.template.today("yyyy-mm-dd") %> - <%= pkg.homepage %> */'
      ].join('')
    },
    concat: {
      withExtensions: {
        src: [
          '<banner>',
          'src/rekapi.license.js',
          'src/rekapi.intro.js',
          'src/rekapi.core.js',
          'src/rekapi.actor.js',
          'src/rekapi.keyframeprops.js',
          'ext/canvas/rekapi.canvas.context.js',
          'ext/canvas/rekapi.canvas.actor.js',
          'ext/dom/rekapi.dom.actor.js',
          'ext/to-css/rekapi.to-css.js',
          'src/rekapi.init.js',
          'src/rekapi.outro.js'
        ],
        dest: 'dist/rekapi.js'
      },
      minimal: {
        src: [
          '<banner>',
          'src/rekapi.license.js',
          'src/rekapi.intro.js',
          'src/rekapi.core.js',
          'src/rekapi.actor.js',
          'src/rekapi.keyframeprops.js',
          'src/rekapi.init.js',
          'src/rekapi.outro.js'
        ],
        dest: 'dist/rekapi.js'
      },
      underscore: {
        src: ['vendor/underscore/underscore-min.js'],
        dest: 'dist/underscore-min.js'
      },
      shifty: {
        src: ['vendor/shifty/shifty.min.js'],
        dest: 'dist/shifty.min.js'
      }
    },
    min: {
      dist: {
        src: ['<banner>', 'dist/rekapi.js'],
        dest: 'dist/rekapi.min.js'
      },
      underscoreBundle: {
        src: [
          'vendor/underscore/underscore.js',
          'vendor/shifty/shifty.js',
          'dist/rekapi.js'],
        dest: 'dist/rekapi-underscore-shifty.min.js'
      }
    },
    uglify: {
      mangle: {
        defines: {
          KAPI_DEBUG: ['name', 'false']
        }
      }
    },
    lint: {
      files: [
        'grunt.js',
        'src/rekapi.!(intro|outro)*.js',
        'ext/**/**.js'
      ]
    },
    qunit: {
      files: ['tests/*.html']
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'lint qunit'
    },
    jshint: {
      options: {
          asi: false,
          boss: true,
          browser: true,
          curly: true,
          eqeqeq: true,
          eqnull: true,
          immed: true,
          lastsemic: true,
          latedef: true,
          laxbreak: true,
          laxcomma: true,
          newcap: true,
          noarg: true,
          nomen: false,
          plusplus: false,
          sub: true,
          undef: true,
          white: false
      },
      globals: {
        KAPI_DEBUG: true,
        noop: true,
        _: true
      }
    }
  });

  // Default task.
  grunt.registerTask('default', 'lint qunit');
  grunt.registerTask('build', 'concat:withExtensions concat:shifty concat:underscore min');

};
