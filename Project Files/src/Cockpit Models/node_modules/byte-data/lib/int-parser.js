/*
 * Copyright (c) 2017-2018 Rafael da Silva Rocha.
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
 * @fileoverview Encode and decode int numbers to and from byte buffers.
 * @see https://github.com/rochars/byte-data
 */

/**
 * A class to write and read integer numbers to and from byte buffers.
 */
export class IntParser {
  
  /**
   * @param {number} bits The number of bits used by the integer.
   * @param {boolean} [signed=false] True for signed, false otherwise.
   * @param {boolean} [clamp=false] True to clamp on overflow.
   */
  constructor(bits, signed=false, clamp=false) {
    /**
     * The number of bits used by one number.
     * @type {number}
     */
    this.bits = bits;
    /**
     * The number of bytes used by one number.
     * @type {number}
     */
    this.offset = Math.ceil(bits / 8);
    /**
     * @type {number}
     * @protected
     */
    this.max = Math.pow(2, bits) - 1;
    /**
     * @type {number}
     * @protected
     */
    this.min = 0;
    /**
     * @type {Function}
     */
    this.unpack = this.unpack_;
    if (signed) {
      this.max = Math.pow(2, bits) / 2 - 1;
      this.min = -this.max - 1;
      this.unpack = this.unpackSigned_;
    }
    if (clamp) {
      this.overflow_ = this.clamp_;
    }
  }

  /**
   * Write one unsigned integer to a byte buffer.
   * @param {!(Uint8Array|Array<number>)} buffer An array of bytes.
   * @param {number} num The number. Overflows are truncated.
   * @param {number} [index=0] The index being written in the byte buffer.
   * @return {number} The next index to write on the byte buffer.
   * @throws {RangeError} On overflow if clamp is set to false.
   * @throws {TypeError} If num is not a integer.
   */
  pack(buffer, num, index=0) {
    if (typeof num !== "number" || !isFinite(num) || Math.floor(num) !== num) {
      throw new TypeError();
    }
    num = this.overflow_(num);
    for (let i = 0, len = this.offset; i < len; i++) {
      buffer[index] = Math.floor(num / Math.pow(2, i * 8)) & 255;
      index++;
    }
    return index;
  }

  /**
   * Read one unsigned integer from a byte buffer.
   * Does not check for overflows.
   * @param {!(Uint8Array|Array<number>)} buffer An array of bytes.
   * @param {number} [index=0] The index to read.
   * @return {number}
   * @private
   */
  unpack_(buffer, index=0) {
    /** @type {number} */
    let num = 0;
    for(let x = 0; x < this.offset; x++) {
      num += buffer[index + x] * Math.pow(256, x);
    }
    return num;
  }

  /**
   * Read one two's complement signed integer from a byte buffer.
   * @param {!(Uint8Array|Array<number>)} buffer An array of bytes.
   * @param {number} [index=0] The index to read.
   * @return {number}
   * @private
   */
  unpackSigned_(buffer, index=0) {
    return this.sign_(this.unpack_(buffer, index));
  }

  /**
   * Throws a RangeError if number is out of boundaries, return
   * the number otherwise.
   * @param {number} num The number.
   * @return {number}
   * @throws {RangeError} If number is out of boundaries.
   * @private
   */
  overflow_(num) {
    if (num > this.max || num < this.min) {
      throw new RangeError();
    }
    return num;
  }

  /**
   * Clamp values on overflow.
   * @param {number} num The number.
   * @private
   */
  clamp_(num) {
    if (num > this.max) {
      return this.max;
    } else if (num < this.min) {
      return this.min;
    }
    return num;
  }

  /**
   * Sign a number.
   * @param {number} num The number.
   * @return {number}
   * @private
   */
  sign_(num) {
    if (num > this.max) {
      num -= (this.max * 2) + 2;
    }
    return num;
  }
}
