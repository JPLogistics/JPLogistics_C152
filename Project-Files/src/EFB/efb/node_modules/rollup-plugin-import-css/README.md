# rollup-plugin-import-css
A Rollup plugin to import CSS into JavaScript

![Actions](https://github.com/jleeson/rollup-plugin-import-css/workflows/build/badge.svg)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/jleeson/rollup-plugin-import-css/blob/master/LICENSE)
[![Donate](https://img.shields.io/badge/patreon-donate-green.svg)](https://www.patreon.com/outwalkstudios)

---

## Usage

```js
import css from "rollup-plugin-import-css";

export default {
    input: "index.js",
    output: { file: "dist/index.js", format: "esm" },
    plugins: [ css() ]
};
```

This will make all imported css files be bundled into a single css file as well as make css files accessible as a default export.

This plugins supports two forms of importing css, when a css file is imported without an assigned variable, the css is bundled into a single css file.
```js
import "./styles.css";
import styles from "./styles.css";
```

If your build uses code splitting via dynamic imports or multiple entry points, this plugin will combine all css imports into a single file.

This plugin respects the import order of your css files.

---

## Options

### include

Type: `array` or `string`
Default: `[]`

A single file, or array of files to include when minifying.

### exclude

Type: `array` or `string`
Default: `[]`

A single file, or array of files to exclude when minifying.

### output

Type: `string`
Default: `null`

An output file name for the css bundle.

### transform

Type: `Function`
Default: `null`

The transform function is used for processing the CSS, it receives a string containing the code to process as an argument. The function should return a string.

### minify

Type: `boolean`
Default: `false`

Minifies the css being imported.

### alwaysOutput

Type: `boolean`
Default: `false`

Always output a css bundle even if the css output is empty.

---

## Why

With WebComponent frameworks, its useful to be able to import the css for a component. Other solutions for rollup either lack features or are large and bloated with extra features that some users may not need such as SASS or LESS support. This plugin is small and by default only supports plain css with the option to process it further. Unlike most other css plugins this plugin maintains the order of your imports in order to avoid overwritting css unexpectedly. 

---

## Reporting Issues

If you are having trouble getting something to work with this plugin or run into any problems, you can create a new [Issue](https://github.com/jleeson/rollup-plugin-import-css/issues).

If this plugin does not fit your needs or is missing a feature you would like to see, let us know! We would greatly appreciate your feedback on it.

---

## License

rollup-plugin-import-css is licensed under the terms of the [**MIT**](https://github.com/jleeson/rollup-plugin-import-css/blob/master/LICENSE) license.
