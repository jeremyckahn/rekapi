/*global module:true */

module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
    qunit: {
      files: ['tests/*.html']
    },
    lint: {
      options: {
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
      },
      files: [
        'src/*.js'
      ]
    }
  });

};
