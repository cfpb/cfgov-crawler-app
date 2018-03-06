var gulp = require('gulp'),
    less = require('gulp-less');

gulp.task('watch', function () {
  gulp.watch('./src/*.less', ['less']);
});

gulp.task('less', function () {
  return gulp.src( './src/*.less' )
    .pipe(less().on('error', function (err) {
      console.log(err);
    }))
    .pipe(gulp.dest('./css/'));

});

gulp.task('default', ['less']);