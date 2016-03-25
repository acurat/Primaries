module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg : grunt.file.readJSON('package.json'),
		uglify : {
			build : {
				src : [ 'js/main.js' ],
				dest : 'js/main.min.js'
			},
			options : {
				mangle : true
			}
		},

		jshint : {
			src : [ 'Gruntfile.js', 'js/main.js' ]

		},

		cssmin : {
			target : {
				files : [ {
					expand : true,
					src : 'css/*.css',
					ext : '.min.css'
				} ]
			}
		}
	});

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-cssmin');

	// Default task(s).
	grunt.registerTask('default', [ 'cssmin', 'jshint','uglify', 'cssmin' ]);

};