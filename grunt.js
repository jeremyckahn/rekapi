/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
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

};
