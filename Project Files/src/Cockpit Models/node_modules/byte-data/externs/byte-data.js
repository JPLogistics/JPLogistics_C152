/*
 * Copyright (c) 2017-2019 Rafael da Silva Rocha.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

/**
 * @fileoverview Externs for byte-data 19.0
 * @see https://github.com/rochars/byte-data
 * @externs
 */

/** @type {!Object} */
var byteData = {};

/**
 * Read a string of UTF-8 characters from a byte buffer.
 * @param {!(Uint8Array|Array<number>)} buffer A byte buffer.
 * @param {number} [index=0] The buffer index to start reading.
 * @param {number} [end=buffer.length] The index to stop reading, non inclusive.
 * @return {string}
 */
byteData.unpackString = function(buffer, index=0, end=buffer.length) {};

/**
 * Write a string of UTF-8 characters as a byte buffer.
 * @param {string} str The string to pack.
 * @return {!Array<number>} The UTF-8 string bytes.
 * @throws {TypeError} If 'str' is not a string.
 */
byteData.packString = function(str) {};

/**
 * Write a string of UTF-8 characters to a byte buffer.
 * @param {string} str The string to pack.
 * @param {!(Uint8Array|Array<number>)} buffer The output buffer.
 * @param {number} [index=0] The buffer index to start writing.
 * @return {number} The next index to write in the buffer.
 * @throws {TypeError} If 'str' is not a string.
 */
byteData.packStringTo = function(str, buffer, index=0) {};

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
byteData.packArrayTo = function(values, theType, buffer, index=0,
    clamp=false) {};

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
byteData.unpackArrayTo = function(
    buffer, theType, output, start=0, end=buffer.length, safe=false) {};

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
byteData.packTo = function(value, theType, buffer, index=0, clamp=false) {};

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
byteData.pack = function(value, theType, clamp=false) {};

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
byteData.unpack = function(buffer, theType, index=0, safe=false) {};

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
byteData.packArray = function(values, theType, clamp=false) {};

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
byteData.unpackArray = function (
  buffer, theType, start=0, end=buffer.length, safe=false) {};
