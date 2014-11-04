/*global module:false, require:true, console:true */
module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-codepainter');
  grunt.loadNpmTasks('grunt-contrib-yuidoc');

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
          {flattern: true, src: ['bower_components/bootstrap/dist/css/bootstrap.min.css'], dest: 'dist/bootstrap/css/bootstrap.min.css'},
          {expand: true, flatten: true, src: ['bower_components/bootstrap/dist/fonts/*'], dest: 'dist/bootstrap/fonts/'},
          {src: ['bower_components/rekapi-controls/lib/font-awesome/css/font-awesome.css'], dest: 'dist/asset/font-awesome.css'},
          {src: ['bower_components/rekapi-controls/dist/dragon-bundle.js'], dest: 'dist/asset/dragon-bundle.js'},
          {src: ['bower_components/rekapi-controls/dist/rekapi-controls.min.js'], dest: 'dist/asset/rekapi-controls.min.js'}
        ]
      },
      redirects: {
        files: [
          {src: ['redirects/renderers/canvas/rekapi.renderer.canvas.js.html'], dest: 'dist/doc/renderers/canvas/rekapi.renderer.canvas.js.html'},
          {src: ['redirects/renderers/dom/rekapi.renderer.dom.js.html'], dest: 'dist/doc/renderers/dom/rekapi.renderer.dom.js.html'},
          {src: ['redirects/src/rekapi.actor.js.html'], dest: 'dist/doc/src/rekapi.actor.js.html'},
          {src: ['redirects/src/rekapi.core.js.html'], dest: 'dist/doc/src/rekapi.core.js.html'},
          {src: ['redirects/src/rekapi.keyframe-property.js.html'], dest: 'dist/doc/src/rekapi.keyframe-property.js.html'},
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
    watch: {
      scripts: {
        files: ['src/*.js', 'renderers/**/*.js'],
        tasks: ['yuidoc'],
        options: {
          interrupt: true
        }
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
    },
    codepainter: {
      source: {
        options: {
          json: '.codepainterrc'
        },
        files: [{
          expand: true,
          cwd: 'src/',
          src: ['rekapi.!(intro|outro|const)*.js'],
          dest: 'src/'
        }]
      }
    },
    yuidoc: {
      compile: {
        name: 'Rekapi',
        description: '<%= pkg.description %>',
        version: '<%= pkg.version %>',
        url: '<%= pkg.homepage %>',
        logo: '../../demo/img/rekapi-logo-200.png',
        options: {
          paths: ['src', 'renderers'],
          themedir: 'yuidoc_theme',
          outdir: 'dist/doc'
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
      'uglify:lodashBundle',
      'concat:withExtensionsDebug',
      'yuidoc',
      'copy:redirects'
      ]);

};
