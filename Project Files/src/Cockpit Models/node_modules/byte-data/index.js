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
 * @fileoverview JavaScript binary parser for any browser or environment.
 * @see https://github.com/rochars/byte-data
 */

/** @module byte-data */

import { endianness } from './lib/endianness';
import { pack as packUTF8, unpack as unpackUTF8 } from './lib/utf8-parser';
import { IntParser } from './lib/int-parser';
import { FloatParser } from './lib/float-parser';

/**
 * Read a string of UTF-8 characters from a byte buffer.
 * @param {!(Uint8Array|Array<number>)} buffer A byte buffer.
 * @param {number} [index=0] The buffer index to start reading.
 * @param {number} [end=buffer.length] The index to stop reading, non inclusive.
 * @return {string}
 */
export function unpackString(buffer, index=0, end=buffer.length) {
  return unpackUTF8(buffer, index, end);
}

/**
 * Write a string of UTF-8 characters as a byte buffer.
 * @param {string} str The string to pack.
 * @return {!Array<number>} The UTF-8 string bytes.
 * @throws {TypeError} If 'str' is not a string.
 */
export function packString(str) {
  /** @type {!Array<number>} */
  let buffer = [];
  packUTF8(str, buffer);
  return buffer;
}

/**
 * Write a string of UTF-8 characters to a byte buffer.
 * @param {string} str The string to pack.
 * @param {!(Uint8Array|Array<number>)} buffer The output buffer.
 * @param {number} [index=0] The buffer index to start writing.
 * @return {number} The next index to write in the buffer.
 * @throws {TypeError} If 'str' is not a string.
 */
export function packStringTo(str, buffer, index=0) {
  return packUTF8(str, buffer, index);
}

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
export function packArrayTo(values, theType, buffer, index=0, clamp=false) {
  theType = theType || {};
  /** @type {!Object} */
  let packer = getParser_(theType.bits, theType.fp, theType.signed, clamp);
  /** @type {number} */
  let offset = Math.ceil(theType.bits / 8);
  /** @type {number} */
  let i = 0;
  /** @type {number} */
  let start = index;
  try {
    for (let valuesLen = values.length; i < valuesLen; i++) {
      index = packer.pack(buffer, values[i], index);
    }
    if (theType.be) {
      endianness(buffer, offset, start, index);
    }
  } catch (e) {
    throwValueError_(e, values[i], i);
  }
  return index;
}

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
export function unpackArrayTo(
    buffer, theType, output, start=0, end=buffer.length, safe=false) {
  theType = theType || {};
  /** @type {!Object} */
  let parser = getParser_(theType.bits, theType.fp, theType.signed, false);
  // getUnpackLen_ will adjust the end index according to the size
  // of the input buffer and the byte offset or throw a error on bad
  // end index if safe=true
  end = getUnpackLen_(buffer, start, end, parser.offset, safe);
  if (theType.be) {
    /** @type {!(Uint8Array|Array<number>)} */
    let readBuffer = copyBuffer_(buffer);
    if (theType.be) {
      endianness(readBuffer, parser.offset, start, end);
    }
    unpack_(readBuffer, output, start, end, parser);
  } else {
    unpack_(buffer, output, start, end, parser);
  }
}

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
export function packTo(value, theType, buffer, index=0, clamp=false) {
  return packArrayTo([value], theType, buffer, index, clamp);
}

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
export function pack(value, theType, clamp=false) {
  /** @type {!Array<number>} */
  let output = [];
  packTo(value, theType, output, 0, clamp);
  return output;
}

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
export function unpack(buffer, theType, index=0, safe=false) {
  let output = [];
  unpackArrayTo(buffer, theType, output,
    index, index + Math.ceil(theType.bits / 8), safe);
  return output[0];
}

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
export function packArray(values, theType, clamp=false) {
  /** @type {!Array<number>} */
  let output = [];
  packArrayTo(values, theType, output, 0, clamp);
  return output;
}

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
export function unpackArray(
    buffer, theType, start=0, end=buffer.length, safe=false) {
  /** @type {!Array<number>} */
  let output = [];
  unpackArrayTo(buffer, theType, output, start, end, safe);
  return output;
}

/**
 * Unpack a array of numbers from a byte buffer to a array or a typed array.
 * @param {!(Uint8Array|Array<number>)} buffer The byte buffer.
 * @param {!(TypedArray|Array<number>)} output The output array or typed array.
 * @param {number} start The buffer index to start reading.
 * @param {number} end The buffer index to stop reading.
 * @param {!Object} parser The parser.
 * @throws {Error} If the type definition is not valid.
 * @private
 */
function unpack_(buffer, output, start, end, parser) {
  /** @type {number} */
  let offset = parser.offset;
  for (let index = 0, j = start; j < end; j += offset, index++) {
    output[index] = parser.unpack(buffer, j);
  }
}

/**
 * Copy a byte buffer as a Array or Uint8Array.
 * @param {!(Uint8Array|Array<number>)} buffer The byte buffer.
 * @return {!(Uint8Array|Array<number>)}
 * @private
 */
function copyBuffer_(buffer) {
  if (buffer.constructor === Array) {
    return buffer.slice();
  }
  return new Uint8Array(buffer);
}

/**
 * Throw a error with information about the problem.
 * @param {!Object} err The Error object that is being raised.
 * @param {*} value The value that caused the error.
 * @param {number} index The index of the value that caused the error.
 * @throws {RangeError|TypeError|Error} A Error with a message.
 * @private
 */
function throwValueError_(err, value, index) {
  err.message = err.constructor.name +
    ' at index ' + index + ': ' + value;
  throw err;
}

/**
 * Adjust the end index according to the input buffer length and the
 * type offset.
 * @param {!(Uint8Array|Array<number>)} buffer The byte buffer.
 * @param {number} start The buffer index to start reading.
 * @param {number} end The buffer index to stop reading.
 * @param {number} offset The number of bytes used by the type.
 * @param {boolean} safe True for size-safe buffer reading.
 * @throws {Error} On bad buffer length, if safe.
 * @private
 */
function getUnpackLen_(buffer, start, end, offset, safe) {
  /** @type {number} */
  let extra = (end - start) % offset;
  if (safe && (extra || buffer.length < offset)) {
    throw new Error('Bad buffer length');
  }
  return end - extra;
}

/**
 * Return a parser for int, uint or fp numbers.
 * @param {number} bits The number of bits.
 * @param {boolean|undefined} fp True for fp numbers, false otherwise.
 * @param {boolean|undefined} signed True for signed ints, false otherwise.
 * @param {boolean|undefined} clamp True to clamp integers, false otherwise.
 * @return {!Object}
 * @private
 */
function getParser_(bits, fp, signed, clamp) {
  if (fp) {
    validateFloatType(bits);
  } else {
    validateIntType(bits);
  }
  if (fp && bits === 16) {
    return new FloatParser(5, 11);
  } else if (fp && bits == 32) {
    return new FloatParser(8, 23);
  } else if(fp && bits == 64) {
    return new FloatParser(11, 52);
  }
  return new IntParser(bits, signed, clamp);
}

/**
 * The type definition error message.
 * @type {string}
 * @private
 */
const TYPE_ERR = 'Unsupported type';

/**
 * Validate the type definition of floating-point numbers.
 * @param {number} bits The number of bits.
 * @throws {Error} If the type definition is not valid.
 * @private
 */
function validateFloatType(bits) {
  if (!bits || bits !== 16 && bits !== 32 && bits !== 64) {
    throw new Error(TYPE_ERR + ': float, bits: ' + bits);
  }
}

/**
 * Validate the type definition of integers.
 * @param {number} bits The number of bits.
 * @throws {Error} If the type definition is not valid.
 * @private
 */
function validateIntType(bits) {
  if (!bits || bits < 1 || bits > 53) {
    throw new Error(TYPE_ERR + ': int, bits: ' + bits);
  }
}
