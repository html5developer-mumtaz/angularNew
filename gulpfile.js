/*jshint strict:false */
/*jshint node:true */

var gulp = require('gulp'),
  del = require('del'),
  watch = require('gulp-watch'),
  sass = require('gulp-ruby-sass'),
  usemin = require('gulp-usemin'),
  uglify = require('gulp-uglify'),
  minifyHtml = require('gulp-minify-html'),
  minifyCss = require('gulp-minify-css'),
  merge = require('merge-stream'),
  plumber = require('gulp-plumber'),
  browsersync = require('browser-sync'),
  ngAnnotate = require('gulp-ng-annotate'),
  reload = browsersync.reload,
  replace = require('gulp-replace'),
  filter = require('gulp-filter'),
  postcss = require('gulp-postcss'),
  sourcemaps = require('gulp-sourcemaps'),
  autoprefixer = require('autoprefixer-core'),
  ftp = require('vinyl-ftp'),
  prompt = require('gulp-prompt'),
  gutil = require('gulp-util'),
  runSequence = require('run-sequence');

// clean dist folder
gulp.task('clean:dist', function(cb) {
  return del(['./dist'], cb);
});

// gulp.task('styles', function() {
//   return sass('./app/assets/sass/app.scss', {
//       sourcemap: true
//     })
//     .pipe(plumber())
//     .pipe(autoprefixer({
//       browsers: ['last 2 versions'],
//       cascade: false
//     }))
//     .pipe(sourcemaps.write('maps', {
//       includeContent: false,
//       sourceRoot: '/source'
//     }))
//     .pipe(gulp.dest('./app/assets/css'))
//     .pipe(filter('**/*.css'))
//     .pipe(reload({
//       stream: true
//     }));
// });


// sass and css

// first process the sass files into one css file
gulp.task('sass', function() {
  return sass('./app/assets/sass')
    .on('error', function(err) {
      console.error('Error!', err.message);
    })
    .pipe(gulp.dest('./app/assets/css'))
    .pipe(reload({
      stream: true
    }));
});

// now take that one css file, autoprefix, create maps, and overwrite
gulp.task('autoprefixer', function() {
  return gulp.src('./app/assets/css/app.css')
    .pipe(sourcemaps.init())
    .pipe(postcss([autoprefixer({
      browsers: ['last 2 versions']
    })]))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./app/assets/css'));
});


gulp.task('styles', function() {
  runSequence('sass', 'autoprefixer');
});


//fonts
gulp.task('fonts', [], function() {
  gulp.src([
      './app/bower_components/bootstrap/dist/fonts/**/*',
      './app/bower_components/font-awesome/fonts/**/*'
    ])
    .pipe(gulp.dest('./app/assets/fonts'));
});

//copy modules
gulp.task('copy:modules', [], function() {
  gulp.src([
      './app/modules/**/i18n/*',
      './app/modules/**/templates/**/*',
      './app/modules/**/assets/img/**/*'
    ])
    .pipe(gulp.dest('./dist/modules'));
});

//copy core templates views
gulp.task('copy:core-templates', [], function() {
  gulp.src([
      './app/core/templates/*'
    ])
    .pipe(gulp.dest('./dist/core/templates'));
});

//copy data json
gulp.task('copy:json-data', [], function() {
  gulp.src([
      './app/modules/**/services/**/*.json'
    ])
    .pipe(gulp.dest('./dist/modules'));
});

//copy core data json
gulp.task('copy:json-core-data', [], function() {
  gulp.src([
      './app/core/data/**/*.json'
    ])
    .pipe(gulp.dest('./dist/core/data'));
});

//copy fonts
gulp.task('copy:fonts', [], function() {
  gulp.src([
      './app/assets/fonts/*'
    ])
    .pipe(gulp.dest('./dist/assets/fonts'));
});

//copy images
gulp.task('copy:images', [], function() {
  gulp.src([
      './app/assets/img/**/*'
    ])
    .pipe(gulp.dest('./dist/assets/img'));
});

//copy core/config
gulp.task('copy:core-config', [], function() {
  gulp.src([
      './app/core/config/*'
    ])
    .pipe(gulp.dest('dist/core/config'));
});

//usemin
gulp.task('usemin', [], function() {
  gulp.src('./app/index.html')
    .pipe(usemin({
      css: [minifyCss(), 'concat'],
      html: [minifyHtml({
        empty: true
      })],
      vendorjs: [uglify({
        mangle: true
      })],
      appjs: [
        replace('debug: true', 'debug: false'),
        ngAnnotate({
          remove: true,
          add: true,
          single_quotes: true
        }),
        uglify({
          mangle: true
        })
      ]
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('browser-sync', function() {
  browsersync({
    server: {
      baseDir: './app'
    }
  });
});

// default task, same as serve
gulp.task('default', ['serve']);

// gulp serve task - runs the server, and watches for changes
gulp.task('serve', ['styles', 'browser-sync'], function() {

  gulp.watch(
    [
      './app/assets/sass/**/*.scss',
      './app/modules/**/*.scss'
    ], ['styles']);

  gulp.watch([
      './app/modules/**/*.js',
      './app/core/**/*.js',
      './app/**/*.html',
      '!./app/modules/i18n/**/*'
    ],
    function() {
      reload();
    });
});

//build
gulp.task('build', ['clean:dist'], function() {
  runSequence(
    'styles',
    'fonts',
    'usemin',
    'copy:modules',
    'copy:core-templates',
    'copy:json-data',
    'copy:json-core-data',
    'copy:images',
    'copy:fonts',
    'copy:core-config'
  );
});

// FTP tasks
// to upload, run "gulp deploy"

var userPass = '';

gulp.task('prompt_password', function() {
  return gulp.src('dist/index.html')
    .pipe(prompt.prompt({
      type: 'password',
      name: 'passwordInput',
      message: 'Please enter your password'
    }, function(res) {
      userPass = res.passwordInput;
    }));
});

gulp.task('deploy', ['prompt_password'], function() {
  var conn = ftp.create({
    host: '10.50.8.173',
    user: 'ST016LO',
    password: userPass,
    parallel: 10,
    log: gutil.log
  });
  var globs = [
    'dist/**'
  ];

  // using base = '.' will transfer everything to /public_html correctly
  // turn off buffering in gulp.src for best performance
  return gulp.src(globs, {
    base: '.',
    buffer: false
  })

  //.pipe(conn.newer('/public_html')) // only upload newer files
  .pipe(conn.dest('/gux-sandbox/fireball'));

});
