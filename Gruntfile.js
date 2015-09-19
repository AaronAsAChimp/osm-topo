/*
    osm-topo - 3D map generator
    Copyright (C) 2015  Aaron Spaulding

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

/*global module*/

module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		// Task configuration.
		jshint: {
			options: {
				'jshintrc': true
			},
			gruntfile: {
				src: 'Gruntfile.js'
			},
			lib_test: {
				src: ['src/**/*.js', 'test/**/*.js']
			}
		},
		nodeunit: {
			files: ['test/**/*.test.js']
		},
		babel: {
			options: {
				'modules': 'commonStrict',
				'whitelist': [
					'es6.modules',
					'es6.arrowFunctions',
					//'minification.deadCodeElimination',
					//'minification.constantFolding',
					'strict'
				],
				'optional': [
					'runtime'
				]
			},
			dist: {
				files: [
					{
						'cwd': 'src/',
						'src': '**/*.js',
						'dest': 'lib/',
						'expand': true,
						'filter': 'isFile'
					}
				]
			}
		},
		watch: {
			gruntfile: {
				files: '<%= jshint.gruntfile.src %>',
				tasks: ['jshint:gruntfile']
			},
			lib_test: {
				files: '<%= jshint.lib_test.src %>',
				tasks: ['jshint:lib_test', 'nodeunit']
			}
		}
	});

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');
	grunt.loadNpmTasks('grunt-babel');

	grunt.registerTask('quality', ['jshint', 'nodeunit']);
	grunt.registerTask('build', ['babel']);

	// Default task.
	grunt.registerTask('default', ['build', 'quality']);

};
