var gulp = require('gulp'),
    postcss  = require('gulp-postcss'),
    sass = require('gulp-ruby-sass'),
    prefix = require('autoprefixer-core'),
    minifycss = require('gulp-minify-css'),
    rename = require('gulp-rename');

gulp.task('styles', function() {
    return sass('sass', { style: 'expanded' })
        .pipe(postcss([ prefix({ browsers: ['last 2 versions'] }) ]))
        .pipe(gulp.dest('css'))
        .pipe(rename({suffix: '.min'}))
        .pipe(minifycss())
        .pipe(gulp.dest('css'));
});

gulp.task('watch', function() {
  gulp.watch('sass/*.scss', ['styles']);
});

gulp.task('default', ['watch'], function() {

});
