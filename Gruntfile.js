/*global module:false, require:true, console:true */
module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-bump');

  var banner = [
        '/*! <%= pkg.name %> - v<%= pkg.version %> - ',
        '<%= grunt.template.today("yyyy-mm-dd") %> - <%= pkg.homepage %> */\n'
      ].join('');

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      withExtensions: {
        options: {
          banner: banner
        },
        src: [
          'src/rekapi.license.js',
          'src/rekapi.intro.js',
          'src/rekapi.const.js',
          'src/rekapi.core.js',
          'src/rekapi.actor.js',
          'src/rekapi.keyframe-property.js',
          'renderers/canvas/rekapi.renderer.canvas.js',
          'renderers/dom/rekapi.renderer.dom.js',
          'src/rekapi.init.js',
          'src/rekapi.outro.js'
        ],
        dest: 'dist/rekapi.js'
      },
      withExtensionsDebug: {
        options: {
          banner: banner
        },
        src: [
          'src/rekapi.license.js',
          'src/rekapi.intro.js',
          'src/rekapi.core.js',
          'src/rekapi.actor.js',
          'src/rekapi.keyframe-property.js',
          'renderers/canvas/rekapi.renderer.canvas.js',
          'renderers/dom/rekapi.renderer.dom.js',
          'src/rekapi.init.js',
          'src/rekapi.outro.js'
        ],
        dest: 'dist/rekapi.js'
      },
      minimal: {
        options: {
          banner: banner
        },
        src: [
          'src/rekapi.license.js',
          'src/rekapi.intro.js',
          'src/rekapi.const.js',
          'src/rekapi.core.js',
          'src/rekapi.actor.js',
          'src/rekapi.keyframe-property.js',
          'src/rekapi.init.js',
          'src/rekapi.outro.js'
        ],
        dest: 'dist/rekapi.js'
      },
      minimalDebug: {
        options: {
          banner: banner
        },
        src: [
          'src/rekapi.license.js',
          'src/rekapi.intro.js',
          'src/rekapi.core.js',
          'src/rekapi.actor.js',
          'src/rekapi.keyframe-property.js',
          'src/rekapi.init.js',
          'src/rekapi.outro.js'
        ],
        dest: 'dist/rekapi.js'
      }
    },
    copy: {
      dist: {
        files: [
          {src: ['bower_components/underscore/underscore-min.js'], dest: 'dist/underscore-min.js'},
          {src: ['bower_components/lodash/dist/lodash.min.js'], dest: 'dist/lodash.min.js'},
          {src: ['bower_components/shifty/dist/shifty.min.js'], dest: 'dist/shifty.min.js'}
        ]
      }
    },
    uglify: {
      standardTarget: {
        files: {
          'dist/rekapi.min.js': ['dist/rekapi.js']
        }
      },
      underscoreBundle: {
        files: {
          'dist/rekapi-underscore-shifty.min.js': [
            'bower_components/underscore/underscore.js',
            'bower_components/shifty/dist/shifty.min.js',
            'dist/rekapi.js']
        }
      },
      lodashBundle: {
        files: {
          'dist/rekapi-lodash-shifty.min.js': [
            'bower_components/lodash/dist/lodash.js',
            'bower_components/shifty/dist/shifty.min.js',
            'dist/rekapi.js']
        }
      },
      options: {
        banner: banner
      }
    },
    qunit: {
      files: ['tests/qunit.{actor,canvas,core,dom,keyframe_props,to_css}.html']
    },
    jshint: {
      all_files: [
        'grunt.js',
        'src/rekapi.!(intro|outro|const)*.js',
        'renderers/**/**.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },
    bump: {
      options: {
        files: ['package.json', 'bower.json'],
        commit: false,
        createTag: false,
        tagName: '%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: false
      }
    }
  });

  // Default task.
  grunt.registerTask('default', ['jshint', 'qunit']);
  grunt.registerTask('build', [
    'copy:dist',
    'concat:withExtensions',
    'uglify:standardTarget',
    'uglify:underscoreBundle',
    'uglify:lodashBundle',
    'concat:withExtensionsDebug'
  ]);

};
