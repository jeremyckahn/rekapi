/*global module:false, require:true, console:true */
module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-dox');

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
        {src: ['bower_components/shifty/dist/shifty.min.js'], dest: 'dist/shifty.min.js'},
        {src: ['bower_components/jquery/jquery.min.js'], dest: 'dist/asset/jquery.js'},
        {src: ['bower_components/ace-builds/src-min/ace.js'], dest: 'dist/asset/ace.js'},
        {src: ['bower_components/ace-builds/src-min/theme-textmate.js'], dest: 'dist/asset/theme-textmate.js'},
        {src: ['bower_components/ace-builds/src-min/mode-javascript.js'], dest: 'dist/asset/mode-javascript.js'},
        {src: ['bower_components/ace-builds/src-min/worker-javascript.js'], dest: 'dist/asset/worker-javascript.js'},
        {src: ['bower_components/requirejs/require.js'], dest: 'dist/asset/require.js'},
        {src: ['bower_components/rekapi-controls/dist/jquery.dragon-slider.css'], dest: 'dist/asset/jquery.dragon-slider.css'},
        {src: ['bower_components/rekapi-controls/dist/rekapi-controls.css'], dest: 'dist/asset/rekapi-controls.css'},
        {expand: true, flatten: true, src: ['bower_components/rekapi-controls/lib/font-awesome/font/*'], dest: 'dist/font/'},
        {src: ['bower_components/rekapi-controls/lib/font-awesome/css/font-awesome.css'], dest: 'dist/asset/font-awesome.css'},
        {src: ['bower_components/rekapi-controls/dist/dragon-bundle.js'], dest: 'dist/asset/dragon-bundle.js'},
        {src: ['bower_components/rekapi-controls/dist/rekapi-controls.min.js'], dest: 'dist/asset/rekapi-controls.min.js'}
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
      options: {
        banner: banner
      }
    },
    qunit: {
      files: ['tests/qunit*.html']
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
    dox: {
      options: {
        title: 'Rekapi'
      },
      files: {
        src: [
          'src/rekapi.core.js',
          'src/rekapi.actor.js',
          'src/rekapi.keyframe-property.js',
          'renderers/canvas/rekapi.renderer.canvas.js',
          'renderers/dom/rekapi.renderer.dom.js'
        ],
        dest: 'dist/doc'
      }
    },
    watch: {
      scripts: {
        files: ['src/*.js', 'renderers/**/*.js'],
        tasks: ['dox'],
        options: {
          interrupt: true
        }
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
      'concat:withExtensionsDebug',
      'dox']);

};
