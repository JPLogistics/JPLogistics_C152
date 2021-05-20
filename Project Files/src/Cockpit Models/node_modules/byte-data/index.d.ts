// Type definitions for byte-data 19.0
// Project: https://github.com/rochars/byte-data
// Definitions by: Rafael da Silva Rocha <https://github.com/rochars>
// Definitions: https://github.com/rochars/byte-data

/**
 * Read a string of UTF-8 characters from a byte buffer.
 * @param {!(Uint8Array|Array<number>)} buffer A byte buffer.
 * @param {number} [index=0] The buffer index to start reading.
 * @param {number} [end=buffer.length] The index to stop reading, non inclusive.
 * @return {string}
 */
export function unpackString(
  buffer: Uint8Array|number[],
  index?: number,
  end?: number): string;

/**
 * Write a string of UTF-8 characters as a byte buffer.
 * @param {string} str The string to pack.
 * @return {!Array<number>} The UTF-8 string bytes.
 * @throws {TypeError} If 'str' is not a string.
 */
export function packString(
  str: string): number[];

/**
 * Write a string of UTF-8 characters to a byte buffer.
 * @param {string} str The string to pack.
 * @param {!(Uint8Array|Array<number>)} buffer The output buffer.
 * @param {number} [index=0] The buffer index to start writing.
 * @return {number} The next index to write in the buffer.
 * @throws {TypeError} If 'str' is not a string.
 */
export function packStringTo(
  str: string,
  buffer: Uint8Array|number[],
  index?: number): number;

// Numbers
/**
 * Pack a array of numbers to a byte buffer.
 * All other packing functions are interfaces to this function.
 * @param {!(Array<number>|TypedArray)} values The values to pack.
 * @param {!{bits:number, fp: (boolean|undefined), signed: (boolean|undefined), be: (boolean|undefined)}} theType The type definition.
 * @param {!(Uint8Array|Array<number>)} buffer The buffer to write on.
 * @param {number} [index=0] The buffer index to start writing.
 * @param {boolean} [clamp=false] True to clamp ints on overflow.
 * @return {number} The next index to write.
 * @throws {Error} If the type definition is not valid.
 * @throws {RangeError} On overflow if clamp is set to false.
 * @throws {TypeError} If 'values' is not a array of numbers.
 * @throws {TypeError} If 'values' is not a array of ints and type is int.
 */
export function packArrayTo(
  values: number[]|ArrayBufferView|ArrayLike<number>,
  theType: object,
  buffer: Uint8Array|number[],
  index?: number,
  clamp?: boolean): number;

/**
 * Unpack a array of numbers from a byte buffer to a array or a typed array.
 * All other unpacking functions are interfaces to this function.
 * @param {!(Uint8Array|Array<number>)} buffer The byte buffer.
 * @param {!{bits:number, fp: (boolean|undefined), signed: (boolean|undefined), be: (boolean|undefined)}} theType The type definition.
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
  buffer: Uint8Array|number[],
  theType: object,
  output: number[]|ArrayBufferView|ArrayLike<number>,
  start?: number,
  end?: number,
  safe?: boolean): void;

/**
 * Pack a number to a byte buffer.
 * @param {number} value The value.
 * @param {!{bits:number, fp: (boolean|undefined), signed: (boolean|undefined), be: (boolean|undefined)}} theType The type definition.
 * @param {!(Uint8Array|Array<number>)} buffer The byte buffer to write on.
 * @param {number} [index=0] The buffer index to write.
 * @param {boolean} [clamp=false] True to clamp ints on overflow.
 * @return {number} The next index to write.
 * @throws {Error} If the type definition is not valid.
 * @throws {RangeError} On overflow if clamp is set to false.
 * @throws {TypeError} If 'value' is not a number.
 * @throws {TypeError} If 'value' is not a int and type is int.
 */
export function packTo(
  value: number,
  theType: object,
  buffer: Uint8Array|number[],
  index?: number,
  clamp?: boolean): number;

/**
 * Pack a number as a array of bytes.
 * @param {number} value The number to pack.
 * @param {!{bits:number, fp: (boolean|undefined), signed: (boolean|undefined), be: (boolean|undefined)}} theType The type definition.
 * @param {boolean} [clamp=false] True to clamp ints on overflow.
 * @return {!Array<number>} The packed value.
 * @throws {Error} If the type definition is not valid.
 * @throws {RangeError} On overflow if clamp is set to false.
 * @throws {TypeError} If 'value' is not a number.
 * @throws {TypeError} If 'value' is not a int and type is int.
 */
export function pack(
  value: number,
  theType: object,
  clamp?: boolean): number[];

/**
 * Unpack a number from a byte buffer.
 * @param {!(Uint8Array|Array<number>)} buffer The byte buffer.
 * @param {!{bits:number, fp: (boolean|undefined), signed: (boolean|undefined), be: (boolean|undefined)}} theType The type definition.
 * @param {number} [index=0] The buffer index to read.
 * @param {boolean} [safe=false] If set to false, extra bytes in the end of
 *   the input array are ignored and input buffers with insufficient bytes will
 *   write nothing to the output array. If safe is set to true the function
 *   will throw a 'Bad buffer length' error on the aforementioned cases.
 * @return {number}
 * @throws {Error} If the type definition is not valid.
 * @throws {Error} On bad input buffer length if on safe mode.
 */
export function unpack(
  buffer: Uint8Array|number[],
  theType: object,
  index?: number,
  safe?: boolean): number;

/**
 * Pack a array of numbers as a array of bytes.
 * @param {!(Array<number>|TypedArray)} values The values to pack.
 * @param {!{bits:number, fp: (boolean|undefined), signed: (boolean|undefined), be: (boolean|undefined)}} theType The type definition.
 * @param {boolean} [clamp=false] True to clamp ints on overflow.
 * @return {!Array<number>} The packed values.
 * @throws {Error} If the type definition is not valid.
 * @throws {RangeError} On overflow if clamp is set to false.
 * @throws {TypeError} If 'values' is not a array of numbers.
 * @throws {TypeError} If 'values' is not a array of ints and type is int.
 */
export function packArray(
  values: number[]|ArrayBufferView|ArrayLike<number>,
  theType: object,
  clamp?:boolean): Array<number>;

/**
 * Unpack a array of numbers from a byte buffer.
 * @param {!(Uint8Array|Array<number>)} buffer The byte buffer.
 * @param {!{bits:number, fp: (boolean|undefined), signed: (boolean|undefined), be: (boolean|undefined)}} theType The type definition.
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
  buffer: Uint8Array|number[],
  theType: object,
  start?: number,
  end?: number,
  safe?: boolean): Array<number>;
