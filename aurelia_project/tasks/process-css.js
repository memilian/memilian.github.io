import gulp from 'gulp';
import changedInPlace from 'gulp-changed-in-place';
import sourcemaps from 'gulp-sourcemaps';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import project from '../aurelia.json';
import lost from 'lost';
import sugarss from 'sugarss';

import {build} from 'aurelia-cli';

export default function processCSS() {
  let processors = [
    lost,
    autoprefixer({browsers: ['last 1 version']})
  ];

  return gulp.src(project.cssProcessor.source)
    .pipe(changedInPlace({firstPass: true}))
    .pipe(sourcemaps.init())
    .pipe(postcss(processors, {parser: sugarss}))
    .pipe(build.bundle());
}
