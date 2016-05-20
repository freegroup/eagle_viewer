module.exports = function (grunt) {

    //Initializing the configuration object
    grunt.initConfig({

        // get the configuration info from package.json ----------------------------
        // this way we can use things like name and version (pkg.name)
        pkg: grunt.file.readJSON('package.json'),

        copy: {
            application: {
                expand: true,
                cwd: 'src/',
                src: ['**/*'],
                dest: 'dist/'
            }
        },

        watch: {
            html: {
                files: [
                    './src/*'
                ],
                tasks: ['copy:application']
            }
        },
        'gh-pages': {
            options: {
                base: 'dist'
            },
            src: ['**']
        }

    });

    // Plugin loading
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-gh-pages');

    // Task definition
    grunt.registerTask('default', [ 'copy' ]);
    grunt.registerTask('publish', ['default','gh-pages']);
};

