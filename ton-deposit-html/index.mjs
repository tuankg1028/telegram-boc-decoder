import fs from "fs";
import browserify from "browserify";
import babelify from "babelify";
import esmify from "esmify";
import tsify from "tsify";

browserify("./tonDeposit.js", {
  plugin: [esmify, tsify],
})
  .transform(
    babelify.configure({
      presets: ["@babel/preset-env"],
      extensions: [".js", ".mjs", ".ts"], // Process both .js and .mjs files
      plugins: ["@babel/plugin-transform-modules-commonjs"], // Transforms ES modules to CommonJS
    }),
    { global: true }
  ) // Ensure global transform to cover node_modules
  .bundle()
  .pipe(fs.createWriteStream("ton-handler.js"));
