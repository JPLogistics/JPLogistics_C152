# CHANGELOG

## 19.0.1 (2020-01-29)
Fix: Ensure original buffer is never touched when unpacking big-endian

## 19.0.0 (2020-01-28)
### API Changes:
- Remove *clamp* optional param from unpacking functions
- Add *safe* optional param to unpack()
- packing values other than integer will throw a *TypeError* if type is integer.
- packing values other than string will throw a *TypeError* if type is string.
- Does not clamp or check for overflows while unpacking

### Other changes
- Zero dependencies

## 18.1.1 (2020-01-26)
- Fix type definitions in docstrings to ease integration with Closure Compiler:
  * The only required attribute in the type definition is the number of bits
- Add the default value of optional parameters to docstrings

## 18.1.0 (2020-01-26)
- Add optional boolean param 'clamp' to all packing functions; when set to true, overflows on integers will be clamped instead of throwing a RangeError. Default is false.

## 18.0.4 (2020-01-04)
- Remove unecessary polyfills
- Use only polyfills that do not pollute the global scope

## 18.0.3 (2020-01-02)
- Fix docstrings for better integration with Closure Compiler

## 18.0.2 (2020-01-02)
- Fix externs file
- Fix docstrings for better integration with Closure Compiler

## 18.0.1 (2020-01-02)
- Fix throwValueError_ docstring

## 18.0.0 (2020-01-02)
- Use RangeError and TypeError instead of just Error

## 17.0.0 (2019-12-31)
- Packing *true* or *false* result in a "Argument is not a valid number" error
- New package structure:
	* dist file is "./dist/byte-data.js", a UMD served as "main"
	* ES6 source is "./index.js", served as "module"

## v16.0.4 (unreleased)
- Fix: TypeScript declaration included in package.json
- Update dependencies to their latest versions

## v16.0.3 (2018-08-09)
- Fix: input index on unpackArrayTo error messages
- Error messages include the value that caused the error along with its index
- Faster and safer packing and unpacking
	- Refactor packArrayTo and unpackArrayTo to improve performance
	- Enforce safe comparisons on input validation

## v16.0.2 (2018-08-06)
- Remove duplicate validation of integers
- Include String.codePointAt() polyfill in scripts/polyfills
- Use 'ArrayBufferView' type instead of 'any' to represent TypedArray in index.d.ts

## v16.0.1 (2018-08-06)
- Faster floating-point parsing
- Fix TypeScript declaration of packArrayTo and unpackArrayTo

## v16.0.0 (2018-08-05)
- *packString(str)* returns a Array; if another type is needed for the output, use *packStringTo(str, buffer)*.
- *unpackString(buffer, start, end)* **end** param is now non-inclusive.
- *null* is not a valid value anymore; *null* values present in the input will cause a 'not a valid number' error.
- Error messages are more informative and include the index of the input/output that caused the error.
- type objects signature changed to use "fp" instead of "float":
```javascript
// instead of 
let f32 = {float: true, bits: 32}; // will not work
// you must use
let f32 = {fp: true, bits: 32}; // will work
```

## v15.1.0 (2018-08-03)
- "safe mode" for unpack array; optional boolean argument 'safe' that defaults to false. If true, a error will be thrown if the input array have extra bytes or not sufficient bytes according to the data type. If false, inputs with insufficient length will generate empty ouputs and extra bytes in the end of the array will be ignored.
```javascript
byteData.unpackArray([0xff], {bits: 16}, 0, 1, true); // throws 'Bad buffer length' error
byteData.unpackArray([0xff, 0xff, 0xff], {bits: 16}, 0, 3, true); // throws 'Bad buffer length' error
byteData.unpackArray([0xff], {bits: 16}, 0, 1); // return a empty array
byteData.unpackArray([0xff, 0xff, 0xff], {bits: 16}, 0, 3); // return a array with one 16-bit unsigned int
```
- type objects signature changed to use "fp" instead of "float"; using "float" still works, but is deprecated and will not work in future releases.
```javascript
// instead of 
let f32 = {float: true, bits: 32};
// you should use
let f32 = {fp: true, bits: 32};
```

## v15.0.0 (2018-08-01)
- Fix: throws error when packing NaN as integer
- Fix: unpack binary16 Infinity, -Infinity and NaN
- Fix: pack binary16 Infinity, -Infinity and NaN
- Compatible with IE6+ and all modern browsers that support ES3/ES5/ES6+

### unpackString(buffer, index=0, end=null)
- unpackString() now returns a Uint8Array.
- the parameters **index** and **end** determine a slice of the buffer to read. So to read the first 4 bytes of a buffer, you would use:
```javascript
let str = unpackString(buffer, 0, 3);
// read from buffer[0], buffer[1], buffer[2], buffer[3]
```

## v14.1.0 (2018-07-19)
- Add countString(string) the API; returns the number of bytes needed to serialize a UTF-8 string.

## v14.0.5 (2018-07-19)
- **Fix: replace invalid UTF-8 characters with U+FFFD instead of throwing errors**
- Fix: packStringTo docstring (remove @throws {Error}).

## v14.0.4 (2018-07-19) [DEPRECATED]
- Validation when reading UTF-8.

## v14.0.3 (2018-07-18) [DEPRECATED]
- Fix: JSDoc unpack() return signature (remove 'undefined').

## v14.0.2 (2018-07-17) [DEPRECATED]
- Fix: unpackArrayTo and unpackArray

## v14.0.1 (2018-07-16) [DEPRECATED]
- Fix errors with strings in ES5 dists (transpile String.codePointAt())
- Throw Error if packing anything other than Number, Boolean or null with pack, packTo, packArray and packArrayTo
- Throw Error for bad buffer length on unpack (not unpackArray or unpackArrayTo; see README for details)

## v14.0.0 (2018-07-15) [DEPRECATED]
- UTF-8 string support on packString, unpackString and packStringTo
- Remove unpackFrom and unpackArrayFrom from the API; unpack and unpackArray now accept the same optional params as unpackFrom and unpackArrayFrom received.

## v13.2.6 (2018-07-13)
- Fix es2015 field in package.json
- Fix documentation issues.

## v13.2.5 (2018-07-09)
- Faster 64-bit fp number read/write.

## v13.2.4 (2018-07-09)
- Handle big-endian data more efficiently.

## v13.2.3 (2018-07-08)
- UMD dist transpiled to ES5.

## v13.2.2 (2018-07-08) [DEPRECATED]
- Fix: Support big-endian hosts.

## v13.2.1 (2018-07-06) [DEPRECATED]
- Fix: lib name in UMD dist.

## v13.2.0 (2018-07-05) [DEPRECATED]
- Allow Array and Uint8Array as output buffer.
- Fix: cases of unpacking extra elements on unpackArrayTo and unpackArrayFrom.

## v13.1.3 (2018-07-05) [DEPRECATED]
- Fix types in TypeScript declaration file.
- Fix JSDoc: Typed Arrays as input for packArray and packArrayTo

## v13.1.2 (2018-07-05) [DEPRECATED]
- Add validation of strings as ASCII.
- Fix documentation issues.

## v13.1.1 (2018-07-04) [DEPRECATED]
- Zero dependencies.

## v13.1.0 (2018-07-02) [DEPRECATED]
- Add unpackArrayTo(buffer, type, output) to output to typed arrays.

## v13.0.1 (2018-06-27) [DEPRECATED]
- Using dot notation to allow better compilation on hosts.

## v13.0.0 (2018-06-26) [DEPRECATED]
- No more standard types; types must be defined by the user.

## v12.0.1 (2018-06-26) [DEPRECATED]
- Add TypeScript declaration file.

## v12.0.0 (2018-06-26) [DEPRECATED]
- Functions from the old API can handle only numbers
- new string functions: packString, packStringTo, unpackString
- null values are packed as zero

## v11.1.0 (2018-06-25) [DEPRECATED]
- Allow better use of this lib as a dependency:
	- package.json refactored with bundlers and ES6 envs in mind
	- Fix inconsistent JSDoc declarations

## v11.0.2 (2018-06-24) [DEPRECATED]
- Fix ES6 dist to not rely on Node module path resolution.

## v11.0.1 (2018-06-23) [DEPRECATED]
- Fix: type declarations
- Fix: remove unused exports

## v11.0.0 (2018-06-22) [DEPRECATED]
- ES6 module
- New API with packTo, packToArray, unpackFrom, unpackArrayFrom

## v10.0.0 (2018-06-15) [DEPRECATED]
- New dist file: ./dist/byte-data.min.js.
- Remove 'browser' from package.json

## v9.0.2 (2018-06-12) [DEPRECATED]
- fix: validation of null, undefined and string length.

## v9.0.1 (2018-06-12) [DEPRECATED]
- fix: dist included in npm package.

## v9.0.0 (2018-06-12) [DEPRECATED]
- dist included in npm package.
- bytes only in base 10 for input and output
- types in byteData.types
- throw errors on overflow and underflow
- throw errors when packing null and undefined values
- throw errors for strings with bad length

## v8.0.3 (2018-06-11) [DEPRECATED]
- fix: webpack.config so no dependency dist is used in the bundle.

## v8.0.1 (2018-05-13) [DEPRECATED]
	- better packaging.

## v8.0.0 (2018-05-05) [DEPRECATED]
	- packStruct() and unpackStruct() are deprecated.
	- Validate type when packing/unpacking, throws Error if type not valid.
	- Fix: unpackArray of types "char" with more than 8 bits return an array of strings, not a single string with all values.
	- Fix: packArray with types "char" and items of length different than the type offset.

## v7.0.1 (2018-05-04) [DEPRECATED]
	- Fix: check for undefined values on pack().
	- Fix: check for null values on unpack().

## v7.0.0 (2018-05-03) [DEPRECATED]
	- Type class is deprecated. Types should be defined as Object<string, *>.

## v6.0.0 (2018-05-03) [DEPRECATED]
	- findString() is deprecated.
