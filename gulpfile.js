// var gulp = require('gulp'),
//     less = require('gulp-less');

const gulp = require( 'gulp' );
const less = require( 'gulp-less' );
const watch = require( 'gulp-watch' );

// gulp.task('watch', function () {
//   gulp.watch('./src/*.less', ['less']);
// });

// gulp.task( 'watch', function() {
//   gulp.watch( './src/*.less', gulp.parallel( 'styles' ) );
// } );

let styles = () => {
  return gulp.src( './src/*.less' )
    .pipe( less( { compress: true } ) )
    .pipe( gulp.dest( './css/' ) );
};

gulp.task( styles );

let defaultTask = gulp.series( styles );

gulp.task( defaultTask );


// gulp.task( 'less', function () {
//   return gulp.src( './src/*.less' )
//     .pipe(less().on('error', function (err) {
//       console.log(err);
//     }))
//     .pipe(gulp.dest('./css/'));
// });

// gulp.task('default', ['styles']);