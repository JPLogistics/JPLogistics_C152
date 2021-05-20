# byte-data
JavaScript binary parser for any browser or environment.  
Copyright (c) 2017-2019 Rafael da Silva Rocha.  
https://github.com/rochars/byte-data

[![NPM version](https://img.shields.io/npm/v/byte-data.svg?style=for-the-badge)](https://www.npmjs.com/package/byte-data) [![Docs](https://img.shields.io/badge/docs-online-blue.svg?style=for-the-badge)](https://rochars.github.io/byte-data/docs/index.html) [![Tests](https://img.shields.io/badge/tests-online-blue.svg?style=for-the-badge)](https://rochars.github.io/byte-data/test/dist/browser.html)  
[![Codecov](https://img.shields.io/codecov/c/github/rochars/byte-data.svg?style=flat-square)](https://codecov.io/gh/rochars/byte-data) [![Unix Build](https://img.shields.io/travis/rochars/byte-data.svg?style=flat-square)](https://travis-ci.org/rochars/byte-data) [![Windows Build](https://img.shields.io/appveyor/ci/rochars/byte-data.svg?style=flat-square&logo=appveyor)](https://ci.appveyor.com/project/rochars/byte-data) [![Scrutinizer](https://img.shields.io/scrutinizer/g/rochars/byte-data.svg?style=flat-square&logo=scrutinizer)](https://scrutinizer-ci.com/g/rochars/byte-data/) [![CII Best Practices](https://bestpractices.coreinfrastructure.org/projects/1974/badge)](https://bestpractices.coreinfrastructure.org/projects/1974)

**byte-data** is JavaScript binary parser for any browser or environment.

- **MIT licensed**
- **Compatible with IE6+ and any environment with ES3/ES5/ES6+ support**
- **Tested in little-endian and big-endian machines!**
- **Zero dependencies**

## Pack/unpack:
- Integers, unsigned and signed (two's complement)
- 16-bit half-precision floating-point numbers
- 32-bit single-precision floating-point numbers
- 64-bit double-precision floating-point numbers
- Little-endian and big-endian words
- UTF-8 strings (1 to 4 bytes per character, invalid characters are replaced)

## Install
```
npm install byte-data
```

## In the Browser
Use the **byte-data.js** file in the */dist* folder:
```html
<script src="./dist/byte-data.js"></script>
<script>
  // Pack a 32-bit floating-point number
  var packed = byteData.pack(2.1474836, {bits: 32, fp: true});
</script>
```

Or load it from the [jsDelivr](https://cdn.jsdelivr.net/npm/byte-data) CDN:
```html
<script src="https://cdn.jsdelivr.net/npm/byte-data"></script>
<script>
  var packed = byteData.pack(2.1474836, {bits: 32, fp: true});
</script>
```

Or load it from [unpkg](https://unpkg.com/byte-data):
```html
<script src="https://unpkg.com/byte-data"></script>
<script>
  var packed = byteData.pack(2.1474836, {bits: 32, fp: true});
</script>
```

### Browser compatibility
This module is distributed as a minified UMD transpiled to ES3 and compatible with IE6+. It should work in all modern browsers and environments that support ES3/ES5/ES6+.

The polyfills used in the compilation are distributed with the package in the *scripts/* folder. The polyfills are for the *defineProperty* and *getOwnPropertyDescriptor* properties of *Object*, and are not used in case those properties are already defined.

If you are not using a package manager to install this module, you can get the it via CDNs:
```html
<script src="https://cdn.jsdelivr.net/npm/byte-data"></script>
<script src="https://unpkg.com/byte-data"></script>
```

Cross-browser tests powered by  
<a href="https://www.browserstack.com"><img src="https://rochars.github.io/byte-data/docs/Browserstack-logo@2x.png" width="150px"/></a>

## Node
```javascript
const byteData = require('byte-data');

// Pack a signed 16-bit integer to a existing byte buffer
// Start writing on index '4' of the buffer
byteData.packTo(1077, {bits: 16, signed: true}, buffer, 4);

// Pack a usigned 8-bit unsigned integer, returns a
// array with the number represented as bytes
let packed = byteData.pack(128, {bits: 8});
```

Or **import** just what you need:
```javascript
import { pack } from 'byte-data';

// Pack a 8-bit unsigned integer
let packed = pack(128, {bits: 8});
```

## About

## pack and packTo
**pack(num, theType)** will return a *Array* with the bytes of the passed value.
```javascript
let packed = pack(123, {bits: 16});
```
**packTo(num, theType, buffer, index)** will write the bytes of the number to the provided buffer (*Uint8Array* or *Array*), start writing on *index*.
```javascript
let buffer = new Uint8Array(4);
packTo(402, {bits: 16}, buffer, 2);
```
*index* can be ommited and will default to **zero**:
```javascript
let buffer = new Uint8Array(4);
packTo(402, {bits: 16}, buffer);
```

### Packing *null*, *false*, *true* and *undefined*
Packing the following values
- *undefined*
- *null*
- *true*
- *false*

will values throw a *TypeError*.

### Unpacking and input buffer length
When unpacking values, **extra bytes in the end of the buffer are ignored** and **insufficient bytes will return a empty array** by default.

You can unpack in **safe mode** with the optional *safe* param set to *true*. **In safe mode insufficient bytes in the input array or extra bytes in the end of the input array will cause a 'Bad buffer length' error**:
```javascript
// throws a 'Bad buffer length' error
byteData.unpackArrayTo([0xff], theType, output, 0, buffer.length, true);

// throws a 'Bad buffer length' error
byteData.unpackArrayTo(
  [0xff, 0xff, 0xff], theType, output, 0, buffer.length, true);

// throws a 'Bad buffer length' error
byteData.unpack([0xff], {bits: 16}, 0, true);

// throws a 'Bad buffer length' error
byteData.unpack([0xff, 0xff, 0xff], {bits: 16}, 2, true);

// do not throw error
byteData.unpack([0xff, 0xff, 0xff], {bits: 16}, 1, true); 
```

### Floating-point numbers
- Floating-point numbers are [IEEE 754](https://en.wikipedia.org/wiki/IEEE_754) standard.
- **Overflows** are rounded towards **Infinity** and **-Infinity**.
- **NaN** is packed as quiet NaN. Both **quiet NaN** and **signaling NaN** can be unpacked.
- Support packing and unpacking **negative zeros**.
- Support packing and unpacking **Infinity** and **negative Infinity**

#### Minifloats
Currently only 16-bit half-precision.

### Integers
- Overflow on integers will throw a *RangeError*.
- Packing values other than integers will throw a *TypeError*.

To clamp integers on overflow and avoid *RangeError*, set the optional *clamp* param to true:
```javascript
// Set clamp to true; values will be packed
// as their max and min values on overflow
pack(value, theType, true);
packTo(value, theType, buffer, index, true);
packArrayTo(values, theType, buffer, index, true);
```

#### Signed integers
Signed integers are [two's complement](https://en.wikipedia.org/wiki/Two%27s_complement).

### Strings
**UTF-8 strings** with 1 to 4 bytes per character can be packed and unpacked. **BOM** is kept untouched if present. Invalid characters are replaced with *Unicode Character 'REPLACEMENT CHARACTER' (U+FFFD)*. Packing values other than strings with *packString()* or *packStringTo()* will throw a **TypeError**.

#### Reading strings from buffers
Use **unpackString(buffer, index, end)**. The paramters **index** and **end** determine a slice of the buffer to read. **End is non-inclusive**. So to read the first 4 bytes of a buffer:
```javascript
let str = unpackString(buffer, 0, 4);
// read from buffer[0], buffer[1], buffer[2], buffer[3]
```

If **index** and **end** are ommited unpackString(buffer) will read the entire buffer:
```javascript
let str = unpackString(buffer);
```

#### Writing strings to buffers
**packStringTo(str, buffer, index=0)** will write the string to the provided buffer (*Uint8Array* or *Array*), starting on the **index**. Index defaults to zero if ommited (start from the beginning of the buffer).
```javascript
// Will write the string to the buffer, array or Uint8Array
let buffer = [];
packStringTo(str, buffer, 0);

// Will return the bytes of the string in a array
let strBytes = packString(str);
```

### Types
Types are user-defined objects like this:
```javascript
const binary32 = {
  bits: 32, // required
  signed: true, // optional, defaults to false
  fp: true, // optional, defaults to false, true for floating-point numbers
  be: false // optional, defaults to false, true for big-endian
}
```

### Tests on big-endian systems
Use [QEMU](https://www.qemu.org/) with this PowerPC/Debian image:  
https://people.debian.org/~aurel32/qemu/powerpc/

## API
```javascript
// Strings
/**
 * Read a string of UTF-8 characters from a byte buffer.
 * @param {!(Uint8Array|Array<number>)} buffer A byte buffer.
 * @param {number} [index=0] The buffer index to start reading.
 * @param {number} [end=buffer.length] The index to stop reading, non inclusive.
 * @return {string}
 */
function unpackString(buffer, index=0, len=buffer.length) {}

/**
 * Write a string of UTF-8 characters as a byte buffer.
 * @param {string} str The string to pack.
 * @return {!Array<number>} The UTF-8 string bytes.
 * @throws {TypeError} If 'str' is not a string.
 */
function packString(str) {}

/**
 * Write a string of UTF-8 characters to a byte buffer.
 * @param {string} str The string to pack.
 * @param {!(Uint8Array|Array<number>)} buffer The output buffer.
 * @param {number} [index=0] The buffer index to start writing.
 * @return {number} The next index to write in the buffer.
 * @throws {TypeError} If 'str' is not a string.
 */
function packStringTo(str, buffer, index=0) {}

// Numbers
/**
 * Pack a array of numbers to a byte buffer.
 * All other packing functions are interfaces to this function.
 * @param {!(Array<number>|TypedArray)} values The values to pack.
 * @param {!{bits:number,
 *   fp: (boolean|undefined),
 *   signed: (boolean|undefined),
 *   be: (boolean|undefined)}} theType The type definition.
 * @param {!(Uint8Array|Array<number>)} buffer The buffer to write on.
 * @param {number} [index=0] The buffer index to start writing.
 * @param {boolean} [clamp=false] True to clamp ints on overflow.
 * @return {number} The next index to write.
 * @throws {Error} If the type definition is not valid.
 * @throws {RangeError} On overflow if clamp is set to false.
 * @throws {TypeError} If 'values' is not a array of numbers.
 * @throws {TypeError} If 'values' is not a array of ints and type is int.
 */
function packArrayTo(values, theType, buffer, index=0, clamp=false) {}

/**
 * Unpack a array of numbers from a byte buffer to a array or a typed array.
 * All other unpacking functions are interfaces to this function.
 * @param {!(Uint8Array|Array<number>)} buffer The byte buffer.
 * @param {!{bits:number,
 *   fp: (boolean|undefined),
 *   signed: (boolean|undefined),
 *   be: (boolean|undefined)}} theType The type definition.
 * @param {!(TypedArray|Array<number>)} output The output array or typed array.
 * @param {number} [start=0] The buffer index to start reading.
 * @param {number} [end=buffer.length] The buffer index to stop reading.
 * @param {boolean} [safe=false] If set to false, extra bytes in the end of
 *   the input array are ignored and input buffers with insufficient bytes will
 *   write nothing to the output array. If safe is set to true the function
 *   will throw a 'Bad buffer length' error on the aforementioned cases.
 * @throws {Error} If the type definition is not valid.
 * @throws {Error} On bad input buffer length if on safe mode.
 */
function unpackArrayTo(
  buffer, theType, output, index=0, end=buffer.length, safe=false) {}

/**
 * Pack a number to a byte buffer.
 * @param {number} value The value.
 * @param {!{bits:number,
 *   fp: (boolean|undefined),
 *   signed: (boolean|undefined),
 *   be: (boolean|undefined)}} theType The type definition.
 * @param {!(Uint8Array|Array<number>)} buffer The byte buffer to write on.
 * @param {number} [index=0] The buffer index to write.
 * @param {boolean} [clamp=false] True to clamp ints on overflow.
 * @return {number} The next index to write.
 * @throws {Error} If the type definition is not valid.
 * @throws {RangeError} On overflow if clamp is set to false.
 * @throws {TypeError} If 'value' is not a number.
 * @throws {TypeError} If 'value' is not a int and type is int.
 */
function packTo(value, theType, buffer, index=0, clamp=false) {}

/**
 * Pack a number as a array of bytes.
 * @param {number} value The number to pack.
 * @param {!{bits:number,
 *   fp: (boolean|undefined),
 *   signed: (boolean|undefined),
 *   be: (boolean|undefined)}} theType The type definition.
 * @param {boolean} [clamp=false] True to clamp ints on overflow.
 * @return {!Array<number>} The packed value.
 * @throws {Error} If the type definition is not valid.
 * @throws {RangeError} On overflow if clamp is set to false.
 * @throws {TypeError} If 'value' is not a number.
 * @throws {TypeError} If 'value' is not a int and type is int.
 */
function pack(value, theType, clamp=false) {}

/**
 * Unpack a number from a byte buffer.
 * @param {!(Uint8Array|Array<number>)} buffer The byte buffer.
 * @param {!{bits:number,
 *   fp: (boolean|undefined),
 *   signed: (boolean|undefined),
 *   be: (boolean|undefined)}} theType The type definition.
 * @param {number} [index=0] The buffer index to read.
 * @param {boolean} [safe=false] If set to false, extra bytes in the end of
 *   the input array are ignored and input buffers with insufficient bytes will
 *   write nothing to the output array. If safe is set to true the function
 *   will throw a 'Bad buffer length' error on the aforementioned cases.
 * @return {number}
 * @throws {Error} If the type definition is not valid.
 * @throws {Error} On bad input buffer length if on safe mode.
 */
function unpack(buffer, theType, index=0, safe=false) {}

/**
 * Pack a array of numbers as a array of bytes.
 * @param {!(Array<number>|TypedArray)} values The values to pack.
 * @param {!{bits:number,
 *   fp: (boolean|undefined),
 *   signed: (boolean|undefined),
 *   be: (boolean|undefined)}} theType The type definition.
 * @param {boolean} [clamp=false] True to clamp ints on overflow.
 * @return {!Array<number>} The packed values.
 * @throws {Error} If the type definition is not valid.
 * @throws {RangeError} On overflow if clamp is set to false.
 * @throws {TypeError} If 'values' is not a array of numbers.
 * @throws {TypeError} If 'values' is not a array of ints and type is int.
 */
function packArray(values, theType, clamp=false) {}

/**
 * Unpack a array of numbers from a byte buffer.
 * @param {!(Uint8Array|Array<number>)} buffer The byte buffer.
 * @param {!{bits:number,
 *   fp: (boolean|undefined),
 *   signed: (boolean|undefined),
 *   be: (boolean|undefined)}} theType The type definition.
 * @param {number} [start=0] The buffer index to start reading.
 * @param {number} [end=buffer.length] The buffer index to stop reading.
 * @param {boolean} [safe=false] If set to false, extra bytes in the end of
 *   the input array are ignored and input buffers with insufficient bytes will
 *   write nothing to the output array. If safe is set to true the function
 *   will throw a 'Bad buffer length' error on the aforementioned cases.
 * @return {!Array<number>}
 * @throws {Error} If the type definition is not valid.
 * @throws {Error} On bad input buffer length if on safe mode.
 */
function unpackArray(buffer, theType, start=0, end=buffer.length, safe=false) {}
```

## Contributing
**byte-data** welcomes all contributions from anyone willing to work in good faith with other contributors and the community. No contribution is too small and all contributions are valued.

See [CONTRIBUTING.md](https://github.com/rochars/byte-data/blob/master/CONTRIBUTING.md) for details.

### Style guide
**byte-data** code should follow the Google JavaScript Style Guide:  
https://google.github.io/styleguide/jsguide.html

### Code of conduct
This project is bound by a code of conduct: The [Contributor Covenant, version 1.4](https://github.com/rochars/byte-data/blob/master/CODE_OF_CONDUCT.md), also available at https://www.contributor-covenant.org/version/1/4/code-of-conduct.html

## Reporting issues
Use the [GitHub issue tracker](https://github.com/rochars/byte-data/issues).

### Reporting security issues
Report security issues to this e-mail: rocha.rafaelsilva@gmail.com.

## Legal
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Frochars%2Fbyte-data.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Frochars%2Fbyte-data?ref=badge_large)

### LICENSE
Copyright (c) 2017-2019 Rafael da Silva Rocha.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
