var gulp = require('gulp'),
	sass = require('gulp-sass'),
	gutil = require('gulp-util'),
	rename = require('gulp-rename'),
	cssmin = require('gulp-cssmin'),
	uglify = require("gulp-uglify");


gulp.task('main-scss',function(){
	gulp.src(['css/main.scss','css/main.*.scss'])
		.pipe(sass({errLogToConsole: true}).on('error',gutil.log))
		.pipe(sass())
		.pipe(cssmin())
		.pipe(gulp.dest('css'));
});


gulp.task('minify-js',function(){
	gulp.src(['js/dom-helper.js'])
		.pipe(uglify())
		.pipe(rename({suffix:".min"}))
		.pipe(gulp.dest("js"));

	gulp.src(['js/main.js'])
		.pipe(uglify())
		.pipe(rename({suffix:".min"}))
		.pipe(gulp.dest("js"));
});


gulp.task('watch',['main-scss', 'minify-js'],function(){
	gulp.watch(['css/main.scss','css/main.*.scss','css/_*.scss'], ['main-scss']);
	gulp.watch(['js/main.js','js/dom-helper.js'], ['minify-js']);
});

gulp.task('default', ['watch']);
