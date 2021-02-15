const { series, parallel, watch, src, dest } = require('gulp');
const pump = require('pump');

// gulp plugins and utils
const livereload = require('gulp-livereload');
const gulpStylelint = require('gulp-stylelint');
const postcss = require('gulp-postcss')
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const zip = require('gulp-zip');
const beeper = require('beeper');
const babel = require("gulp-babel")

// postcss plugins
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

function serve(done) {
    livereload.listen();
    done();
}

function handleError(done) {
    return function (err) {
        if (err) {
            beeper();
        }
        return done(err);
    };
};

function hbs(done) {
    pump([
        src(['*.hbs', 'partials/**/*.hbs', 'members/**/*.hbs']),
        livereload()
    ], handleError(done));
}

function css(done) {
    pump([
        src('assets/scss/screen.scss', { sourcemaps: true }),
        sass({ includePaths: ['node_modules'] }).on('error', sass.logError),
        postcss([
            autoprefixer(),
            cssnano()
        ]),
        dest('assets/built/', { sourcemaps: '.' }),
        livereload()
    ], handleError(done));
}

function js(done) {
    pump([
        src([
            'assets/js/main.js'
        ], { sourcemaps: true }),
        babel({
        presets: [
            [
                "@babel/env",
                    {
                        modules: false
                    }
                ]
            ]
        }),
        concat('main.min.js'),
        uglify(),
        dest('assets/built/', { sourcemaps: '.' }),
        livereload()
    ], handleError(done));
}

function lint(done) {
    pump([
        src(['assets/css/**/*.scss']),
        gulpStylelint({
            fix: true,
            reporters: [
                { formatter: 'string', console: true }
            ]
        }),
        dest('assets/scss/')
    ], handleError(done));
}

function zipper(done) {
    const filename = require('./package.json').name + '.zip';

    pump([
        src([
            '**',
            '!node_modules', '!node_modules/**',
            '!dist', '!dist/**',
            '!yarn-error.log'
        ]),
        zip(filename),
        dest('dist/')
    ], handleError(done));
}

const hbsWatcher = () => watch(['*.hbs', 'partials/**/*.hbs', 'members/**/*.hbs'], hbs);
const cssWatcher = () => watch('assets/css/**/*.css', css);
const jsWatcher = () => watch('assets/js/**/*.js', js);
const watcher = parallel(hbsWatcher, cssWatcher, jsWatcher);
const build = series(css, js);

exports.build = build;
exports.lint = lint;
exports.zip = series(build, zipper);
exports.default = series(build, serve, watcher);
