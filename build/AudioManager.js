(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

(function () {
  try {
    cachedSetTimeout = setTimeout;
  } catch (e) {
    cachedSetTimeout = function () {
      throw new Error('setTimeout is not defined');
    }
  }
  try {
    cachedClearTimeout = clearTimeout;
  } catch (e) {
    cachedClearTimeout = function () {
      throw new Error('clearTimeout is not defined');
    }
  }
} ())
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = cachedSetTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    cachedClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        cachedSetTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],4:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":3,"_process":2,"inherits":1}],5:[function(require,module,exports){
//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Audio Channel class.
 *
 * @author  Cedric Stoquer
 *
 *
 * @param {string} id - channel name id
 */
function AudioChannel(id) {
	this.id        = id;
	this.volume    = 1.0;
	this.muted     = true;
	this.loopSound = null;
	this.loopId    = null;
	this.loopVol   = 0.0;
	this.nextLoop  = null;
}
module.exports = AudioChannel;


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
AudioChannel.prototype.setVolume = function (volume, muted) {
	var wasChannelMuted = this.muted;
	this.muted = volume === 0 || muted || false;
	if (volume !== undefined && volume !== null) {
		this.volume = volume;
	} else {
		volume = this.volume;
	}

	if (!this.loopId) return;

	// this channel have a looped sound (music, ambient sfx)
	// we have to take care of this looped sound playback if channel state changed
	if (this.loopSound && this.muted) {
		// a sound was playing, channel becomes muted
		this.loopSound.stop();
		// TODO: unload sound ?
	} else if (this.loopSound && this.loopSound.id === this.loopId) {
		// correct sound is loaded in channel, updating volume & playback
		this.loopSound.setVolume(Math.max(0, Math.min(1, volume * this.loopVol)));
		if (wasChannelMuted) { this.loopSound.play(); }
	} else if (!this.muted) {
		// sound is not loaded in channel, channel has been unmutted
		this.audioManager.playLoopSound(this.id, this.loopId, this.loopVol);
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
AudioChannel.prototype.setMute = function (mute) {
	this.setVolume(null, mute);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Play a long looped sound (e.g. background music).
 *  Only one looped sound can play per channel.
 *
 * @param {string} soundId   - sound id
 * @param {number} [volume]  - optional volume, a integer in range ]0..1]
 * @param {number} [pan]     - optional panoramic, a integer in rage [-1..1]
 * @param {number} [pitch]   - optional pitch, in semi-tone
 */
AudioChannel.prototype.playLoopSound = function (soundId, volume, pan, pitch, loopStart, loopEnd) {
	var audioManager   = this.audioManager;
	var defaultFade    = audioManager.settings.defaultFade;
	var crossFading    = audioManager.settings.crossFading;
	var currentSound   = this.loopSound;
	var currentSoundId = currentSound && currentSound.id;

	volume = Math.max(0, Math.min(1, volume || 1));

	this.loopId  = soundId;
	this.loopVol = volume;

	// don't load or play sound if audio or channel is mutted
	if (audioManager.muted || this.muted) return;

	// if requested sound is already playing, update volume, pan and pitch
	if (soundId === currentSoundId && currentSound) {
		currentSound.play(volume * this.volume, pan, pitch);
		if (this.nextLoop) {
			this.nextLoop.cancelOnLoadCallbacks();
			this.nextLoop = null;
		}
		return;
	}

	currentSound = null;

	// check if requested sound is already scheduled to play next
	if (this.nextLoop && this.nextLoop.id === soundId) return;

	var self = this;

	function stopCurrentLoop(sound, cb) {
		if (!sound) return cb && cb();
		if (sound.stopping) return; // callback is already scheduled
		sound.stop(function () {
			audioManager.freeSound(sound); // TODO: add an option to keep file in memory
			sound = null;
			return cb && cb();
		});
	}

	function _playNextSound() {
		var sound = self.loopSound = self.nextLoop;
		self.nextLoop = null;
		if (!sound) return;
		sound.setLoop(true, loopStart, loopEnd);
		sound.fade = defaultFade;
		sound.load(function onSoundLoad(error) {
			if (error) {
				sound.unload();
				self.loopSound = null;
				return;
			}
			sound.play(volume * self.volume, pan, pitch);
		});
	}

	function playNextSound() {
		// remove reference to current loop sound to ease optimistic garbabe collection
		self.loopSound = null;
		// force loading to happen at next tick in order to let garbage collector to release previous audio.
		window.setTimeout(_playNextSound, 0);
	}

	if (crossFading) {
		if (this.nextLoop) {
			// if another nextSound already loading, cancel previous callback
			this.nextLoop.cancelOnLoadCallbacks();
		}
		this.nextLoop = audioManager.createSound(soundId, this.id);
		this.nextLoop.load(function onSoundLoad(error) {
			if (error) {
				self.nextLoop.unload();
				self.nextLoop = null;
				return;
			}
			stopCurrentLoop(self.loopSound);
			playNextSound();
		});

	} else {
		this.nextLoop = audioManager.createSound(soundId, this.id);
		stopCurrentLoop(this.loopSound, playNextSound);
	}
};

},{}],6:[function(require,module,exports){
var AudioContext = window.AudioContext || window.webkitAudioContext;
var OrderedList  = require('./OrderedList');
var SoundObject  = require('./SoundBuffered.js');
var SoundGroup   = require('./SoundGroup.js');
var AudioChannel = require('./AudioChannel.js');
var ISound       = require('./ISound.js');

if (!AudioContext) {
	console.warn('Web Audio API is not supported on this platform. Fallback to regular HTML5 <Audio>');
	SoundObject = require('./Sound.js');
	if (!window.Audio) {
		console.warn('HTML5 <Audio> is not supported on this platform. Sound features are unavailable.');
		SoundObject = ISound;
	}
}


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Audio manager
 * @author  Cedric Stoquer
 *
 * @param {String[]} channels - list of channel ids to be created
 */
function AudioManager(channels) {
	this.soundsById            = {};
	this.soundGroupsById       = {};
	this.permanentSounds       = {};
	this.freeSoundPool         = [];
	this.soundArchive          = new OrderedList(function () { return 1; });
	this.soundGroupArchive     = new OrderedList(function () { return 1; });
	this.soundArchiveById      = {};
	this.soundGroupArchiveById = {};
	this.usedMemory            = 0;
	this.channels              = {};
	this.audioContext          = null;
	this.muted                 = false;

	// settings
	this.settings = {
		audioPath:      '',   // path to audio assets folder
		maxSoundGroup:  500,
		maxUsedMemory:  300,  // seconds
		defaultFade:    2,    // seconds
		maxPlayLatency: 1000, // milliseconds
		crossFading:    false,
		getFileUri:     function getFileUri(audioPath, id) { return audioPath + id + '.mp3'; },
		getSoundConstructor: function getSoundConstructor(channelId, soundId) { return null; }
	};

	// create channels
	for (var i = 0; i < channels.length; i++) {
		var channelId = channels[i];
		this.channels[channelId] = new AudioChannel(channelId);
	}

	// register self
	ISound.prototype.audioManager       = this;
	SoundGroup.prototype.audioManager   = this;
	AudioChannel.prototype.audioManager = this;
}

module.exports = AudioManager;

// expose ISound for custom sound constructors
module.exports.ISound = ISound;


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Initialise audio.
 *  On iOS, this function must be called on an user interaction (e.g. tap a button) or sound won't play.
 */
AudioManager.prototype.init = function () {
	if (this.audioContext || !AudioContext) return;
	this.audioContext = new AudioContext();

	// register audioContext on sound Class
	SoundObject.prototype.audioContext = this.audioContext;
	
	// sounds could have been preloaded, initialize them.
	for (var id in this.soundsById) {
		this.soundsById[id].init();
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Get a unused sound object (or a new one if no more empty sounds are available in pool)
 *
 * @param {string} channelId - channel id where the sound will be used
 * @param {string} soundId   - sound id
 *
 * @return {Object} sound object
 */
AudioManager.prototype.getEmptySound = function (channelId, soundId) {
	var sound;

	// custom sound constructor
	var constructor = this.settings.getSoundConstructor(channelId, soundId);
	if (constructor) {
		sound = new constructor();
		return sound;
	}

	if (this.freeSoundPool.length > 0) {
		sound = this.freeSoundPool.pop();
		sound.init();
	} else {
		sound = new SoundObject();
	}
	return sound;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Setup channels volume and mute. This function is used when retrieving user preferences.
 *
 * @param {Object}  channels            - object containnig channels setup list. Keys are channel ids
 *        {number}  channels[id].volume - volume of channel id
 *        {boolean} channels[id].muted  - mute setting for channel id
 */
AudioManager.prototype.setup = function (channels) {
	for (var channelId in channels) {
		var params = channels[channelId];
		this.setVolume(channelId, params.volume, params.muted);
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
AudioManager.prototype.addChannel = function (channelId) {
	if (this.channels[channelId]) return;
	this.channels[channelId] = new AudioChannel(channelId);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Set channel's volume
 *
 * @param {String} channelId - channel id
 * @param {number} volume    - channel volume, float in range [0..1]
 */
AudioManager.prototype.setVolume = function (channelId, volume, muted) {
	var channel = this.channels[channelId];
	if (!channel) return;
	channel.setVolume(volume, muted);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Mute / unmute all channels
 *
 * @param {boolean} [muted] - Should all channels be muted. If not specified, function will behave as toggle
 */
AudioManager.prototype.setMute = function (muted) {
	if (muted === undefined) muted = !this.muted;
	this.muted = !!muted;

	// take care of loop sounds in channels
	for (var channelId in this.channels) {
		var channel = this.channels[channelId];
		if (!channel.loopSound) continue;
		if (muted) {
			channel.loopSound.stop();
		} else {
			// FIXME: force channel.muted to change from true to its current value
			var channelMuted = channel.muted;
			channel.muted = true;
			channel.setVolume(null, channelMuted);
		}
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Create and load sound
 *
 * @param {number}   id   - sound id
 * @param {Function} [cb] - optional callback function called when sound has finished to load
 */
AudioManager.prototype.loadSound = function (id, cb) {
	var sound = this.createSound(id);
	sound.load(cb);
	return sound;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Create sound but don't load it
 *
 * @param {number} id - sound id
 */
AudioManager.prototype.createSound = function (id, channelId) {
	var sound = this.getSound(id);
	if (sound) return sound;
	sound = this.soundsById[id] = this.getEmptySound(channelId, id);
	sound.setId(id);
	return sound;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Create a sound that won't be unloaded.
 *
 * @param {number} id - sound id
 */
AudioManager.prototype.createSoundPermanent = function (id, channelId) {
	var sound = this.getSound(id);
	// TODO: Check if sound is permanent and move it to permanents list if it's not the case.
	//       Because permanents sound (UI sounds) are created at app startup, this should not happend.
	if (sound) return sound;

	var constructor = this.settings.getSoundConstructor(channelId, id) || SoundObject;
	sound = this.permanentSounds[id] = new constructor();
	sound.setId(id);
	return sound;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Get a sound by its id
 *
 * @param {number} id - sound id
 */
AudioManager.prototype.getSound = function (id) {
	// search sound in permanents
	var sound = this.permanentSounds[id];
	if (sound) return sound;

	// search sound in active list
	sound = this.soundsById[id];
	if (sound) return sound;

	// search sound in archives
	sound = this.soundArchiveById[id];
	if (!sound) return null;

	// remove sound from archives
	this.soundArchive.removeByRef(sound.poolRef);
	sound.poolRef = null;
	delete this.soundArchiveById[id];

	// add sound back in active list
	this.soundsById[id] = sound;
	return sound;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Get a soundGroup by it's id
 *
 * @param {number} id - sound group id
 */
AudioManager.prototype.getSoundGroup = function (id) {
	// search soundGroup in active list
	var soundGroup = this.soundGroupsById[id];
	if (soundGroup) return soundGroup;

	// search soundGroup in archives
	soundGroup = this.soundGroupArchiveById[id];
	if (!soundGroup) return null;

	// remove soundGroup from archives
	this.soundGroupArchive.removeByRef(soundGroup.poolRef);
	soundGroup.poolRef = null;
	delete this.soundGroupArchiveById[id];

	// check that all individual sound of the group are loaded
	soundGroup.verifySounds();

	// add soundGroup back in active list
	this.soundGroupsById[id] = soundGroup;
	return soundGroup;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Unload and remove sound to free memory.
 *  We keep Sound instance for later reuse.
 *
 * @param {number} sound - sound wrapper object
 */
AudioManager.prototype.freeSound = function (sound) {
	var soundId = sound.id;
	if (this.soundsById[soundId]) { delete this.soundsById[soundId]; }
	if (this.soundArchiveById[soundId]) {
		this.soundArchive.removeByRef(sound.poolRef);
		sound.poolRef = null;
		delete this.soundArchiveById[soundId];
	}
	sound.unload();

	// don't add freed sound in pool if it's created from a custom constructor
	if (sound instanceof SoundObject) this.freeSoundPool.push(sound);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Play a long looped sound (e.g. background music) in specified channel.
 *  Only one looped sound can play per channel.
 *
 * @param {string} channelId - channel id.
 * @param {string} soundId   - sound id
 * @param {number} [volume]  - optional volume, a integer in range ]0..1]
 * @param {number} [pan]     - optional panoramic, a integer in rage [-1..1]
 * @param {number} [pitch]   - optional pitch, in semi-tone
 */
AudioManager.prototype.playLoopSound = function (channelId, soundId, volume, pan, pitch, loopStart, loopEnd) {
	var channel = this.channels[channelId];
	if (!channel) return console.warn('Channel id "' + channelId + '" does not exist.');
	channel.playLoopSound(soundId, volume, pan, pitch, loopStart, loopEnd);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Stop currently playing lopped sound in channel */
AudioManager.prototype.stopLoopSound = function (channelId) {
	var self = this;
	var channel = this.channels[channelId];
	if (!channel) return console.warn('Channel id "' + channelId + '" does not exist.');
	var currentSound = channel.loopSound;
	channel.loopId = null;
	if (!currentSound) return;
	currentSound.stop(function onSoundStop() {
		self.freeSound(currentSound);
		channel.loopSound = null;
	});
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Stop and cleanup all looped sounds */
AudioManager.prototype.stopAllLoopSounds = function () {
	for (var channelId in this.channels) {
		this.stopLoopSound(channelId);
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Called when map is changed, or on disconnection.
 *  All current sounds are archived, and if memory limit is reached,
 *  oldest used sounds are unloadded.
 */
AudioManager.prototype.release = function () {
	var maxSoundGroup = this.settings.maxSoundGroup;
	var maxUsedMemory = this.settings.maxUsedMemory;
	var id, soundGroup, sound;

	// don't release looped sounds
	var loopedSounds = {};
	for (id in this.channels) {
		var channel = this.channels[id];
		if (channel.loopSound) {
			loopedSounds[channel.loopSound.id] = true;
		}
	}

	// archive all sound groups
	for (id in this.soundGroupsById) {
		soundGroup = this.soundGroupsById[id];
		soundGroup.poolRef = this.soundGroupArchive.add(soundGroup);
		this.soundGroupArchiveById[id] = soundGroup;
		delete this.soundGroupsById[id];
	}

	// archive all sounds
	for (id in this.soundsById) {
		if (loopedSounds[id]) continue;
		sound = this.soundsById[id];
		sound.poolRef = this.soundArchive.add(sound);
		this.soundArchiveById[id] = sound;
		delete this.soundsById[id];
	}

	// free sound groups if count limit is reached
	var count = this.soundGroupArchive.getCount();
	while (count > maxSoundGroup) {
		soundGroup = this.soundGroupArchive.popFirst();
		if (!soundGroup) break;
		soundGroup.poolRef = null;
		delete this.soundGroupArchiveById[soundGroup.id];
		count -= 1;
	}

	// free sounds if memory limit is reached
	while (this.usedMemory > maxUsedMemory) {
		sound = this.soundArchive.popFirst();
		if (!sound) break;
		sound.poolRef = null;
		delete this.soundArchiveById[sound.id];
		this.freeSound(sound);
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Play a sound in provided channel
 *
 * @param {String} channelId - channel id used to play sound
 * @param {String} soundId   - sound id
 * @param {number} [volume]  - optional volume value. volume:]0..1]
 * @param {number} [pan]     - optional panoramic value. pan:[-1..1]
 * @param {number} [pitch]   - optional pitch value in semi-tone. Only work with webAudio enabled
 */
AudioManager.prototype.playSound = function (channelId, soundId, volume, pan, pitch) {
	if (this.muted) return;
	var channel = this.channels[channelId];
	if (channel.muted) return;
	var sound = this.getSound(soundId);
	if (!sound) { sound = this.createSound(soundId, channelId); }
	volume = volume || 1.0;
	sound.play(channel.volume * volume, pan, pitch);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Play a sound group
 *
 * @param {String} channelId    - channel id used to play sound
 * @param {String} soundGroupId - sound group id
 * @param {number} [volume]     - optional volume value. volume:]0..1]
 * @param {number} [pan]        - optional panoramic value. pan:[-1..1]
 */
AudioManager.prototype.playSoundGroup = function (channelId, soundGroupId, volume, pan, pitch) {
	if (this.muted) return;
	var channel = this.channels[channelId];
	if (!channel || channel.muted) return;
	var soundGroup = this.getSoundGroup(soundGroupId);
	if (!soundGroup) return console.warn('SoundGroup "' + soundGroupId + '" does not exist.');
	volume = volume || 1.0;
	soundGroup.play(volume * channel.volume, pan, pitch);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Create a list of sound groups.
 *
 * @param {String}   soundGroupId        - soundGroup id
 * @param {Object}   soundGroupDef       - definition of sound group
 *        {String[]} soundGroupDef.id    - sound ids
 *        {number[]} soundGroupDef.vol   - sound volumes. vol:[0..1]
 *        {number[]} soundGroupDef.pitch - sound pitches in semi-tone.
 * @param {String}  [muted]              - if muted, then sounds are created but not loaded
 */
AudioManager.prototype.createSoundGroup = function (soundGroupId, soundGroupDef, muted) {
	if (this.getSoundGroup(soundGroupId)) return;
	var soundGroup = new SoundGroup(soundGroupId, soundGroupDef.id, soundGroupDef.vol, soundGroupDef.pitch, muted);
	this.soundGroupsById[soundGroupId] = soundGroup;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Create a list of sound groups.
 *
 * @param {Object}   soundGroupDefs          - definitions of sound groups
 *        {String[]} soundGroupDefs[*].id    - sound ids
 *        {number[]} soundGroupDefs[*].vol   - sound volumes. vol:[0..1]
 *        {number[]} soundGroupDefs[*].pitch - sound pitches in semi-tone.
 * @param {String}  [channelId]              - channel id the sound group will play in
 */
AudioManager.prototype.createSoundGroups = function (soundGroupDefs, channelId) {
	var muted = channelId !== undefined ? this.channels[channelId].muted : false;
	for (var soundGroupId in soundGroupDefs) {
		this.createSoundGroup(soundGroupId, soundGroupDefs[soundGroupId], muted);
	}
};

},{"./AudioChannel.js":5,"./ISound.js":7,"./OrderedList":8,"./Sound.js":9,"./SoundBuffered.js":10,"./SoundGroup.js":11}],7:[function(require,module,exports){
//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Sound Abstract class.
 * Implement dynamic loading / unloading mechanism.
 *
 * @author  Cedric Stoquer
 * 
 */
function ISound() {
	// public properties
	this.playing         = false;
	this.stopping        = false;
	this.fade            = 0;
	this.usedMemory      = 0;
	this.poolRef         = null;

	// the following properties are public but should NOT be assigned directly.
	// instead, use the setter functions: setId, setVolume, setPan, setLoop, setPitch.
	this.id              = null;
	this.volume          = 1.0;
	this.pan             = 0.0;
	this.loop            = false;
	this.pitch           = 0.0;

	// private properties
	this._loaded         = false;
	this._loading        = false;
	this._unloading      = false;
	this._playTriggered  = 0;

	this._onLoadQueuedCallback = [];
}

module.exports = ISound;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
ISound.prototype.setId = function (value) {
	this.id      = value;
	this._loaded = false;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Load sound
 *
 * @param {Function} [cd] - optional callback function
 */
ISound.prototype.load = function (cb) {
	if (!this.id) return cb && cb('noId');
	if (this._loaded) return cb && cb(null, this);

	if (cb) { this._onLoadQueuedCallback.push(cb); }
	if (this._loading) return;
	this._loading = true;

	return this._load();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Finalize sound loading
 *
 * @param {String} error - set when loading has failed
 */
ISound.prototype._finalizeLoad = function (error) {
	var maxPlayLatency = this.audioManager.settings.maxPlayLatency;

	this._loaded  = !error;
	this._loading = false;

	for (var i = 0; i < this._onLoadQueuedCallback.length; i++) {
		this._onLoadQueuedCallback[i](error, this);
	}
	this._onLoadQueuedCallback = [];

	if (this._unloading) {
		this._unloading = false;
		this.unload();
		return;
	}

	if (this._loaded && this._playTriggered) {
		if (this.loop || Date.now() - this._playTriggered < maxPlayLatency) { this._play(); }
		this._playTriggered = 0;
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Remove callback set on load */
ISound.prototype.cancelOnLoadCallbacks = function () {
	this._onLoadQueuedCallback = [];
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Play sound. If sound is not yet loaded, it is loaded in memory and flagged to be played
 *  once loading has finished. If loading take too much time, playback may be cancelled.
 *
 * @param {number} [vol]   - optional volume
 * @param {number} [pan]   - optional panoramic
 * @param {number} [pitch] - optional pitch value in semi-tone (available only if using webAudio)
 */
ISound.prototype.play = function (vol, pan, pitch) {
	if (vol !== undefined && vol !== null) { this.setVolume(vol); }
	if (pan !== undefined && pan !== null) { this.setPan(pan); }

	if (!this._loaded) {
		this._playTriggered = Date.now();
		this.load();
		return;
	}

	// prevent a looped sound to play twice
	// TODO: add a flag to allow force restart
	if (this.loop && this.playing) {
		// update pitch if needed
		this._updatePlayPitch(pitch);
		return;
	}

	this._play(pitch);
};

//█████████████████████████████████████████████████████████████████████████████████
//████████████████████████████████████████▄███████▄░██████████▄░███████▄░██████████
//█▀▄▄▄▄▀█▄░▄██▄░▄█▀▄▄▄▄▀█▄░▀▄▄▄█▄░▀▄▄▄█▄▄░███▀▄▄▄▀░██▀▄▄▄▄▀███░▀▄▄▄▀███░███▀▄▄▄▄▀█
//█░████░███░██░███░▄▄▄▄▄██░██████░███████░███░████░██▀▄▄▄▄░███░████░███░███░▄▄▄▄▄█
//█▄▀▀▀▀▄████░░████▄▀▀▀▀▀█▀░▀▀▀██▀░▀▀▀██▀▀░▀▀█▄▀▀▀▄░▀█▄▀▀▀▄░▀█▀░▄▀▀▀▄█▀▀░▀▀█▄▀▀▀▀▀█
//█████████████████████████████████████████████████████████████████████████████████

ISound.prototype.init      = function () { /* virtual function */ };
ISound.prototype.setVolume = function (value) { this.volume = value; };
ISound.prototype.setPan    = function (value) { this.pan    = value; };
ISound.prototype.setLoop   = function (value) { this.loop   = value; };
ISound.prototype.setPitch  = function (pitch) { this.pitch  = pitch; };
ISound.prototype._updatePlayPitch = function (pitch) { /* virtual */ };

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Play sound. Abstract method to be overwritten */
ISound.prototype._play = function (pitch) {
	this.playing = true;
	console.log('ISound play call: "' + this.id + '"');
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Stop sound
 *
 * @param {Function} [cb] - optional callback function (use it when sound has a fade out)
 */
ISound.prototype.stop = function (cb) {
	this.playing = false;
	return cb && cb();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Load sound. Abstract method to be overwritten
 * @private
 */
ISound.prototype._load = function () {
	console.log('ISound load call: ' + this.id);
	return this._finalizeLoad(null);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Unload sound from memory */
ISound.prototype.unload = function () {
	this._playTriggered = 0;
	this.setLoop(false);
	this.fade  = 0;
	this.pitch = 0;
	this.stop();

	if (this._loading) {
		this._unloading = true;
		return false;
	}

	this.audioManager.usedMemory -= this.usedMemory;
	this.setVolume(1.0);
	this.setPan(0.0);
	this.id         = null;
	this._loaded    = false;
	this.usedMemory = 0;

	return true;
};

},{}],8:[function(require,module,exports){
/**
 * PRIORITY LIST Class
 *
 * @author Brice Chevalier
 *
 * @param {function} comparison function that takes two parameters a and b and returns a number
 *
 * @desc Priority list data structure, elements remain sorted
 *
 *    Method                Time Complexity
 *    ___________________________________
 *
 *    add                    O(n), O(1) if insertion at the beginning or at the end of the list
 *    remove                 O(1)
 *    getFirst               O(1)
 *    getLast                O(1)
 *    popFirst               O(1)
 *    popLast                O(1)
 *    getCount               O(1)
 *    forEach                O(n * P) where P is the complexity of the input function
 *    forEachReverse         O(n * P) where P is the complexity of the input function
 *    clear                  O(n) indirectly because of garbage collection
 *
 *    Memory Complexity in O(n)
 */

function Node(obj, previous, next, container) {
	this.object    = obj;
	this.previous  = previous;
	this.next      = next;
	this.container = container;
}

function OrderedList(comparisonFunction) {
	this.count   = 0;
	this.first   = null;
	this.last    = null;
	this.cmpFunc = comparisonFunction;
}

OrderedList.prototype.add = function (obj) {
	var newNode = new Node(obj, null, null, this);
	this.count += 1;

	if (this.first === null) {
		this.first = newNode;
		this.last  = newNode;
		return newNode;
	}

	var cmpFirst = this.cmpFunc(obj, this.first.object);
	if (cmpFirst < 0) {
		// insertion at the beginning of the list
		newNode.next = this.first;
		this.first.previous = newNode;
		this.first = newNode;
		return newNode;
	}

	var cmpLast = this.cmpFunc(obj, this.last.object);
	if (cmpLast >= 0) {
		// insertion at the end
		newNode.previous = this.last;
		this.last.next = newNode;
		this.last = newNode;
		return newNode;
	}

	var current;
	if (cmpFirst + cmpLast < 0) {
		current = this.first.next;
		while (this.cmpFunc(obj, current.object) >= 0) {
			current = current.next;
		}

		// insertion before current
		newNode.next = current;
		newNode.previous = current.previous;
		newNode.previous.next = newNode;
		current.previous = newNode;
	} else {
		current = this.last.previous;
		while (this.cmpFunc(obj, current.object) < 0) {
			current = current.previous;
		}

		// insertion after current
		newNode.previous = current;
		newNode.next = current.next;
		newNode.next.previous = newNode;
		current.next = newNode;
	}
	return newNode;
};

OrderedList.prototype.removeByRef = function (node) {
	if (!node || node.container !== this) {
		return false;
	}
	this.count -= 1;

	// Removing any reference to the node
	if (node.previous === null) {
		this.first = node.next;
	} else {
		node.previous.next = node.next;
	}
	if (node.next === null) {
		this.last = node.previous;
	} else {
		node.next.previous = node.previous;
	}

	// Removing any reference from the node to any other element of the list
	node.previous = null;
	node.next     = null;
	node.container     = null;
	return true;
};

OrderedList.prototype.moveToTheBeginning = function (node) {
	if (!node || node.container !== this) {
		return false;
	}

	if (node.previous === null) {
		// node is already the first one
		return true;
	}

	// Connecting previous node to next node
	node.previous.next = node.next;

	if (this.last === node) {
		this.last = node.previous;
	} else {
		// Connecting next node to previous node
		node.next.previous = node.previous;
	}

	// Adding at the beginning
	node.previous = null;
	node.next = this.first;
	node.next.previous = node;
	this.first = node;
	return true;
};

OrderedList.prototype.moveToTheEnd = function (node) {
	if (!node || node.container !== this) {
		return false;
	}

	if (node.next === null) {
		// node is already the last one
		return true;
	}

	// Connecting next node to previous node
	node.next.previous = node.previous;

	if (this.first === node) {
		this.first = node.next;
	} else {
		// Connecting previous node to next node
		node.previous.next = node.next;
	}

	// Adding at the end
	node.next = null;
	node.previous = this.last;
	node.previous.next = node;
	this.last = node;
	return true;
};

OrderedList.prototype.possess = function (node) {
	return node && (node.container === this);
};

OrderedList.prototype.popFirst = function () {
	var node = this.first;
	if (!node) {
		return null;
	}

	this.count -= 1;
	var pop  = node.object;

	this.first = node.next;
	if (this.first !== null) {
		this.first.previous = null;
	}

	node.next = null;
	node.container = null;
	return pop;
};

OrderedList.prototype.popLast = function () {
	var node = this.last;
	if (!node) {
		return null;
	}

	this.count -= 1;
	var pop  = node.object;

	this.last = node.previous;
	if (this.last !== null) {
		this.last.next = null;
	}

	node.previous = null;
	node.container = null;
	return pop;
};

OrderedList.prototype.getFirst = function () {
	return this.first && this.first.object;
};

OrderedList.prototype.getLast = function () {
	return this.last && this.last.object;
};

OrderedList.prototype.clear = function () {
	for (var current = this.first; current; current = current.next) {
		current.container = null;
	}

	this.count = 0;
	this.first = null;
	this.last  = null;
};

OrderedList.prototype.getCount = function () {
	return this.count;
};

OrderedList.prototype.forEach = function (processingFunc, params) {
	for (var current = this.first; current; current = current.next) {
		processingFunc(current.object, params);
	}
};

OrderedList.prototype.forEachReverse = function (processingFunc, params) {
	for (var current = this.last; current; current = current.previous) {
		processingFunc(current.object, params);
	}
};

OrderedList.prototype.reposition = function (node) {
	if (node.container !== this) {
		return this.add(node.object);
	}

	var prev = node.previous;
	var next = node.next;
	var obj  = node.object;

	if (next === null) {
		this.last = prev;
	} else {
		next.previous = prev;
	}

	if (prev === null) {
		this.first = next;
	} else {
		prev.next = next;
	}

	while (prev !== null && this.cmpFunc(obj, prev.object) < 0) {
		next = prev;
		prev = prev.previous;
	}

	while (next !== null && this.cmpFunc(obj, next.object) >= 0) {
		prev = next;
		next = next.next;
	}

	node.next = next;
	if (next === null) {
		this.last = node;
	} else {
		next.previous = node;
	}

	node.previous = prev;
	if (prev === null) {
		this.first = node;
	} else {
		prev.next = node;
	}

	return node;
};

module.exports = OrderedList;
},{}],9:[function(require,module,exports){
var inherits     = require('util').inherits;
var ISound       = require('./ISound.js');
var PLAY_OPTIONS = { playAudioWhenScreenIsLocked: false };


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Audio wrapper using HTML5 <Audio>
 * @author  Cedric Stoquer
 * 
 */
function Sound() {
	ISound.call(this);

	var audio   = new Audio();
	audio.loop  = false;
	audio.type  = 'audio/mpeg';
	this._audio = audio;

	// if available, use webAudio for better performances
	if (this.audioContext) {
		this.source = this.audioContext.createMediaElementSource(audio);
		this.source.connect(this.audioContext.destination);
	}
}
inherits(Sound, ISound);
module.exports = Sound;


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Sound.prototype.setVolume = function (value) {
	this.volume = this._audio.volume = value;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Sound.prototype.setLoop = function (value) {
	this.loop = this._audio.loop = value;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Load sound
 * @private
 */
Sound.prototype._load = function () {
	var self = this;

	function loadFail(error) {
		// TODO: keep track that loading has failed to not retry to loading it
		self._finalizeLoad(error);
	}

	function onAudioLoaded() {
		this.removeEventListener('canplaythrough', onAudioLoaded);
		this.removeEventListener('error', onAudioError);
		self.usedMemory = this.duration;
		self.audioManager.usedMemory += this.duration;
		self._finalizeLoad(null);
	}

	function onAudioError(error) {
		this.removeEventListener('canplaythrough', onAudioLoaded);
		this.removeEventListener('error', onAudioError);
		loadFail(error);
	}

	function loadAudio(uri) {
		self._loading = true;
		self._audio.addEventListener('canplaythrough', onAudioLoaded);
		self._audio.addEventListener('error', onAudioError);
		self._audio.src = uri;
		self._audio.load();
	}

	var getFileUri = this.audioManager.settings.getFileUri;
	var audioPath  = this.audioManager.settings.audioPath;

	if (getFileUri.length > 2) {
		// asynchronous
		getFileUri(audioPath, this.id, function onUri(error, uri) {
			if (error) return loadFail(error);
			loadAudio(uri);
		});
	} else {
		// synchronous
		try {
			var uri = getFileUri(audioPath, this.id);
			if (!uri) return loadFail('emptyUri');
			loadAudio(uri);
		} catch (error) {
			loadFail(error);
		}
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Unload sound from memory */
Sound.prototype.unload = function () {
	if (ISound.prototype.unload.call(this)) {
		this._audio.volume = 1.0;
		this._audio.src = '';
		this._audio.load();
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Play sound. If sound is not yet loaded, it is loaded in memory and flagged to be played
 *  once loading has finished. If loading take too much time, playback may be cancelled.
 */
Sound.prototype._play = function (pitch) {
	// TODO: sound pan
	// TODO: fade-in
	this._audio.volume = this.volume;
	this._audio.pause();
	this._audio.currentTime = 0;
	this._audio.play(PLAY_OPTIONS);
	this.playing = true;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Stop sound
 *
 * @param {Function} [cb] - optional callback function (use it when sound has a fade out)
 */
Sound.prototype.stop = function (cb) {
	this._audio.pause();
	this._audio.currentTime = 0;
	this._playTriggered = 0;
	this.playing = false;
	return cb && cb(); // TODO: fade-out
};

},{"./ISound.js":7,"util":4}],10:[function(require,module,exports){
var inherits = require('util').inherits;
var ISound   = require('./ISound.js');

// setValueAtTime, exponentialRampToValueAtTime and linearRampToValueAtTime thrown an exception if
// provided value is less than or equal to 0.
// we use MIN_VALUE instead of 0 when calling these functions
// see:
// http://webaudio.github.io/web-audio-api/#widl-AudioParam-exponentialRampToValueAtTime-void-float-value-double-endTime
// http://stackoverflow.com/questions/29819382/how-does-the-audioparam-exponentialramptovalueattime-work
var MIN_VALUE = 0.000001;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Audio wrapper using AudioBufferSourceNode
 * @author  Cedric Stoquer
 * 
 */
function SoundBuffered() {
	ISound.call(this);

	this.buffer          = null;
	this.source          = null;
	this.sourceConnector = null;
	this.gain            = null;
	this.panNode         = null;
	this.rawAudioData    = null;

	this._playPitch      = 0.0;  // pitch for each independent play
	this._fadeTimeout    = null;
	this._onStopCallback = null;
	this._audioNodeReady = false;

	this._loopStart      = 0;
	this._loopEnd        = 0;

	this.init();
}
inherits(SoundBuffered, ISound);
module.exports = SoundBuffered;


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SoundBuffered.prototype._createAudioNodes = function () {
	if (this._audioNodeReady) return;
	if (!this.audioContext) return;

	// create webAudio nodes
	// source -> gain -> pan -> destination

	var audioContext = this.audioContext;
	var gainNode     = audioContext.createGain();
	var panNode;

	if (audioContext.createStereoPanner) {
		panNode = audioContext.createStereoPanner();
	} else {
		// fallback to 3D PannerNode
		panNode = audioContext.createPanner();
	}

	gainNode.connect(panNode);
	panNode.connect(audioContext.destination);

	gainNode.gain.value  = 0;
	this.sourceConnector = gainNode;
	this.gain            = gainNode.gain;
	this.panNode         = panNode;

	this._audioNodeReady = true;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SoundBuffered.prototype._destroyAudioNodes = function () {
	if (!this._audioNodeReady) return;

	var audioContext = this.audioContext;
	var panNode      = this.panNode;
	var gainNode     = this.sourceConnector;

	gainNode.disconnect(panNode);
	panNode.disconnect(audioContext.destination);

	if (this.source) {
		this.source.disconnect(gainNode);
		this.source.onended = null;
		this.source = null;
	}

	this.sourceConnector = null;
	this.gain            = null;
	this.panNode         = null;
	this.rawAudioData    = null;
	this._audioNodeReady = false;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SoundBuffered.prototype.init = function () {
	this._createAudioNodes();

	if (!this.rawAudioData) return;

	var self           = this;
	var maxPlayLatency = this.audioManager.settings.maxPlayLatency;
	var audioContext   = this.audioContext;


	function onAudioDecodeSuccess(buffer) {
		self.buffer = buffer;
		self.usedMemory = buffer.duration;
		self.audioManager.usedMemory += buffer.duration;
		self.rawAudioData = null;
		if (self._loaded && self._playTriggered) {
			if (self.loop || Date.now() - self._playTriggered < maxPlayLatency) { self._play(); }
			self._playTriggered = 0;
		}
	}

	function onAudioDecodeFail() {
		console.error('decode audio failed for sound ', self.id);
	}

	audioContext.decodeAudioData(this.rawAudioData, onAudioDecodeSuccess, onAudioDecodeFail);
};


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SoundBuffered.prototype.setVolume = function (value) {
	this.volume = value;
	if (!this.playing) return;
	if (!this.fade) {
		this.gain.value = value;
		return;
	}
	if (value <= 0) value = MIN_VALUE;
	var currentTime = this.audioContext.currentTime;
	this.gain.cancelScheduledValues(currentTime);
	this.gain.setValueAtTime(this.gain.value || MIN_VALUE, currentTime);
	this.gain.linearRampToValueAtTime(value, currentTime + this.fade);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SoundBuffered.prototype.setPan = function (value) {
	this.pan = value;
	if (!this.panNode) return;
	if (this.panNode.pan) {
		// stereo panning
		this.panNode.pan.value = value;
	} else {
		// 3D panning
		this.panNode.setPosition(value, 0, 0.2);
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SoundBuffered.prototype.setLoop = function (value, loopStart, loopEnd) {
	this.loop       = !!value;
	this._loopStart = loopStart || 0;
	this._loopEnd   = loopEnd   || 0;
	if (!this.source || !this.buffer) return;

	this.source.loop = value;
	this._setLoopPoints();
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SoundBuffered.prototype._setLoopPoints = function () {
	this.source.loopStart = this._loopStart || 0;

	var loopEnd = this._loopEnd;

	// When loop end point is negative, we set endPoint from the end of the buffer
	if (loopEnd < 0) loopEnd = this.buffer.duration + loopEnd;
	if (loopEnd < 0) loopEnd = 0;
	this.source.loopEnd = loopEnd || this.buffer.duration;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Set sound pitch
 *
 * @param {number} pitch        - pitch in semi-tone
 * @param {number} [portamento] - duration to slide from previous to new pitch.
 */
SoundBuffered.prototype.setPitch = function (pitch, portamento) {
	this.pitch = pitch;
	this._setPlaybackRate(portamento);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SoundBuffered.prototype._updatePlayPitch = function (pitch) {
	if ((pitch || pitch === 0) && pitch !== this._playPitch) {
		this._playPitch = pitch;
		this._setPlaybackRate(0);
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SoundBuffered.prototype._setPlaybackRate = function (portamento) {
	if (!this.source) return;
	var rate = Math.pow(2, (this._playPitch + this.pitch) / 12);
	if (!portamento) {
		this.source.playbackRate.value = rate;
		return;
	}
	var currentTime = this.audioContext.currentTime;
	this.source.playbackRate.cancelScheduledValues(currentTime);
	this.source.playbackRate.setValueAtTime(this.source.playbackRate.value || MIN_VALUE, currentTime);
	this.source.playbackRate.linearRampToValueAtTime(rate, currentTime + portamento);
};


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Load sound
 * @private
 */
SoundBuffered.prototype._load = function () {
	var self = this;

	this._createAudioNodes();

	function loadFail(error) {
		// TODO: keep track that loading has failed so we don't retry to load it ?
		self._finalizeLoad(error);
	}

	function onAudioLoaded(buffer) {
		self.buffer = buffer;
		self.usedMemory = buffer.duration;
		self.audioManager.usedMemory += buffer.duration;
		self._finalizeLoad(null);
	}

	function loadAudio(uri) {
		var xobj = new XMLHttpRequest();
		xobj.responseType = 'arraybuffer';

		xobj.onreadystatechange = function onXhrStateChange() {
			if (~~xobj.readyState !== 4) return;
			if (~~xobj.status !== 200 && ~~xobj.status !== 0) {
				return loadFail('xhrError:' + xobj.status);
			}
			if (self.audioContext) {
				self.audioContext.decodeAudioData(xobj.response, onAudioLoaded, loadFail);
			} else {
				self.rawAudioData = xobj.response;
				self._finalizeLoad(null);
			}
		};

		xobj.open('GET', uri, true);
		xobj.send();
	}

	var getFileUri = this.audioManager.settings.getFileUri;
	var audioPath  = this.audioManager.settings.audioPath;

	if (getFileUri.length > 2) {
		// asynchronous
		getFileUri(audioPath, this.id, function onUri(error, uri) {
			if (error) return loadFail(error);
			loadAudio(uri);
		});
	} else {
		// synchronous
		try {
			var uri = getFileUri(audioPath, this.id);
			if (!uri) return loadFail('emptyUri');
			loadAudio(uri);
		} catch (error) {
			loadFail(error);
		}
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Unload sound from memory */
SoundBuffered.prototype.unload = function () {
	if (ISound.prototype.unload.call(this)) {
		if (this._fadeTimeout) {
			this._onStopCallback = null;
			this._stopAndClear();
		}
		this.buffer = null;
		if (this.source) {
			this.source.onended = null;
			this.source.stop(0);
			this.source = null;
		}
		this._destroyAudioNodes();
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Play sound. If sound is not yet loaded, it is loaded in memory and flagged to be played
 *  once loading has finished. If loading take too much time, playback may be cancelled.
 */
SoundBuffered.prototype._play = function (pitch) {
	if (!this.buffer) {
		this._playTriggered = Date.now();
		return;
	}

	this.playing = true;

	var currentTime = this.audioContext.currentTime;
	this.gain.cancelScheduledValues(currentTime);
	if (this.fade) {
		this.gain.setValueAtTime(this.gain.value || MIN_VALUE, currentTime);
		this.gain.linearRampToValueAtTime(this.volume || MIN_VALUE, currentTime + this.fade);
	} else {
		this.gain.value = this.volume;
	}

	// if sound is still fading out, clear all onStop callback
	if (this._fadeTimeout) {
		this._onStopCallback = null;
		this.source.onended = null;
		this.stopping = false;
		window.clearTimeout(this._fadeTimeout);
		this._fadeTimeout = null;
		return;
	}

	if (this.source) {
		this.source.disconnect(this.sourceConnector);
		this.source.onended = null;
	}

	var sourceNode = this.source = this.audioContext.createBufferSource();
	sourceNode.connect(this.sourceConnector);

	var self = this;
	sourceNode.onended = function onPlaybackEnd() {
		self.playing       = false;
		sourceNode.onended = null;
		self.source        = null;
	};

	this._playPitch = pitch || 0;
	if (pitch || this.pitch) {
		this._setPlaybackRate(0);
	}

	sourceNode.loop   = this.loop;
	sourceNode.buffer = this.buffer;
	this._setLoopPoints();
	sourceNode.start(0);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
SoundBuffered.prototype._stopAndClear = function () {
	this.stopping = false;
	this.source.onended = null;
	this.source.stop(0);
	this.source = null;
	if (this._fadeTimeout) {
		window.clearTimeout(this._fadeTimeout);
		this._fadeTimeout = null;
	}
	if (this._onStopCallback) {
		this._onStopCallback();
		this._onStopCallback = null;
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Stop sound
 *
 * @param {Function} [cb] - optional callback function
 */
SoundBuffered.prototype.stop = function (cb) {
	if (!this.playing && !this.stopping) return cb && cb();
	this._playTriggered = 0;
	this.stopping = true;
	this.playing  = false;
	if (!this.source) return cb && cb();

	this._onStopCallback = cb; // TODO: do we allow multiple stop cb ?

	if (this._fadeTimeout) return;

	if (this.fade) {
		var self = this;
		var currentTime = this.audioContext.currentTime;
		this.gain.cancelScheduledValues(currentTime);
		this.gain.setValueAtTime(this.gain.value || MIN_VALUE, currentTime);
		this.gain.linearRampToValueAtTime(MIN_VALUE, currentTime + this.fade);
		this._fadeTimeout = window.setTimeout(function onFadeEnd() {
			self._fadeTimeout = null;
			self._stopAndClear();
		}, this.fade * 1000);
		return;
	}

	this._stopAndClear();
};


},{"./ISound.js":7,"util":4}],11:[function(require,module,exports){
//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Set of sound played in sequence each times it triggers
 *  used for animation sfx
 * @author Cedric Stoquer
 *
 * @param {String}       id       - sound ground id
 * @param {number[]}     soundIds - array of sound ids
 * @param {number[]}     volumes  - array of volumes
 * @param {number[]}     pitches  - array of pitches
 */
function SoundGroup(id, soundIds, volumes, pitches, muted) {
	this.id         = id;
	this.soundIds   = soundIds;
	this.volumes    = volumes || [];
	this.pitches    = pitches || [];
	this.soundIndex = 0;
	this.volIndex   = 0;
	this.pitchIndex = 0;
	this.poolRef    = null;
	this._ready     = false;

	if (this.volumes.length === 0) this.volumes.push(1.0);
	if (this.pitches.length === 0) this.pitches.push(0.0);

	if (!muted) this._createSounds();
}
module.exports = SoundGroup;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Create and load all sound used in group */
SoundGroup.prototype._createSounds = function () {
	var soundIds = this.soundIds;
	for (var i = 0; i < soundIds.length; i++) {
		this.audioManager.loadSound(soundIds[i]);
	}
	this._ready = true;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Play sound group.
 *
 * @param {number} [volume] - optional volume
 * @param {number} [pan]    - optional panoramic
 * @param {number} [pitch]  - optional pitch value in semi-tone (available only if using webAudio)
 */
SoundGroup.prototype.play = function (volume, pan, pitch) {
	if (this.soundIds.length === 0) return;
	if (!this._ready) this._createSounds();
	var soundId = this.soundIds[this.soundIndex++];
	var sound = this.audioManager.getSound(soundId);
	if (!sound) return console.warn('[Sound Group: ' + this.id + '] sound id ' + soundId + '  cannot be played.');
	volume = volume || 1.0;
	pitch  = pitch  || 0.0;
	volume *= this.volumes[this.volIndex++];
	pitch  += this.pitches[this.pitchIndex++];
	sound.play(volume, pan, pitch);
	if (this.soundIndex >= this.soundIds.length) { this.soundIndex = 0; }
	if (this.volIndex   >= this.volumes.length)  { this.volIndex   = 0; }
	if (this.pitchIndex >= this.pitches.length)  { this.pitchIndex = 0; }
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Check that all sounds in group are correctly created */
SoundGroup.prototype.verifySounds = function () {
	for (var i = 0; i < this.soundIds.length; i++) {
		var soundId = this.soundIds[i];
		this.audioManager.createSound(soundId);
	}
};

},{}],12:[function(require,module,exports){
AudioManager = require('./AudioManager.js');

},{"./AudioManager.js":6}]},{},[12]);
