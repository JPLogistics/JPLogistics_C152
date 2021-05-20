;
/**
 * @fileoverview Polyfills for old browsers.
 * @see https://github.com/inexorabletash/polyfill/blob/master/es5.js
 * @see https://gist.github.com/jhermsmeier/9a34b06a107bbf5d2c91
 */

// ES 15.2.3.6 Object.defineProperty ( O, P, Attributes )
// Partial support for most common case - getters, setters, and values
(function() {
  if (!Object.defineProperty ||
      !(function () { try { Object.defineProperty({}, 'x', {}); return true; } catch (e) { return false; } } ())) {
    var orig = Object.defineProperty;
    Object.defineProperty = function (o, prop, desc) {
      // In IE8 try built-in implementation for defining properties on DOM prototypes.
      if (orig) { try { return orig(o, prop, desc); } catch (e) {} }

      if (o !== Object(o)) { throw TypeError("Object.defineProperty called on non-object"); }
      if (Object.prototype.__defineGetter__ && ('get' in desc)) {
        Object.prototype.__defineGetter__.call(o, prop, desc.get);
      }
      if (Object.prototype.__defineSetter__ && ('set' in desc)) {
        Object.prototype.__defineSetter__.call(o, prop, desc.set);
      }
      if ('value' in desc) {
        o[prop] = desc.value;
      }
      return o;
    };
  }
}());

// On older versions of IE Object.getOwnPropertyDescriptor can only be
// called with DOM elements; Here it is tested against a non-DOM object.
// If an error is raised, the method is replaced.
// https://gist.github.com/jhermsmeier/9a34b06a107bbf5d2c91
try {
  Object.getOwnPropertyDescriptor({"t":"o"}, "t");
} catch(err) {
  Object.getOwnPropertyDescriptor = function( object, key ) {
    
    var hasSupport =
      typeof object.__lookupGetter__ === 'function' &&
      typeof object.__lookupSetter__ === 'function'
    
    // TODO: How does one determine this?!
    var isGetterSetter = !hasSupport ? null :
      object.__lookupGetter__( key ) ||
      object.__lookupSetter__( key )
    
    return isGetterSetter != null ? {
      configurable: true,
      enumerable: true,
      get: object.__lookupGetter__( key ),
      set: object.__lookupSetter__( key )
    } : {
      configurable: true,
      writable: true,
      enumerable: true,
      value: object[ key ]
    }
  }
}
