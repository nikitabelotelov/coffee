/// <amd-module name="Core/patchRequireJS" />

/* global define, Object */

/**
 * Some patches for RequireJS through official and semi-official API
 * @class Core/patchRequireJS
 * @author Мальцев А.А.
 */
const getInstance = function() {
   const global = (function() {
      return this || (0, eval)('this');// eslint-disable-line no-eval
   }());

   return global.requirejs;
};

/**
 * Undefines failed modules on error to force RequireJS try again to load them and generate that error
 * @param {Error} err Error instance
 * @param {Function} [require] RequireJS
 */
const undefineFailed = function(err, require) {
   if (arguments.length < 2) {
      require = getInstance();
   }
   if (err.originalError) {
      undefineFailed(err.originalError, require);
   }
   if (require && err.requireModules) {
      err.requireModules.forEach((moduleName) => {
         require.undef(moduleName);
      });
   }
};

/**
 * Registers RequireJS errors hook
 * @param {Function} require RequireJS
 */
const registerErrorHandler = function(require) {
   require.onError = function(err) {
      undefineFailed(err, require);
      throw err;
   };
};

/**
 * Does some stuff with loaded modules: makes functions serializable for example
 * @param {Function} require RequireJS
 */
const registerResourceLoadCallback = function(require) {
   // https://github.com/requirejs/requirejs/wiki/Internal-API:-onResourceLoad
   require.onResourceLoad = (function(source) {
      const makeFunctionSerializable = function(func, moduleName, path) {
            func.toJSON = function() {
               const serialized = {
                  $serialized$: 'func',
                  module: moduleName,
                  path:undefined
               };
               if (path) {
                  serialized.path = path;
               }
               return serialized;
            };
         },

         makeArraySerializable = function(arr, moduleName, prefix, depth) {
            let arrLength = arr.length,
               i;

            prefix = prefix ? `${prefix}.` : '';
            for (i = 0; i < arrLength; i++) {
               makeSerializable(depth, arr[i], moduleName, prefix + i);
            }
         },

         makeObjectSerializable = function(obj, moduleName, prefix, depth) {
            let keys = Object.keys(obj),
               keysLength = keys.length,
               prop,
               i;

            prefix = prefix ? `${prefix}.` : '';
            for (i = 0; i < keysLength; i++) {
               prop = keys[i];
               makeSerializable(depth, obj[prop], moduleName, prefix + prop);
            }
         },

         /**
          * После require js модуля на все функции навешивается toJSON
          * функции ищутся рекурсивно вглубь объектов.
          * Модуль А: { f1 : function(){} }
          * Модуль В: { K :  {
          *                    someFunction: A.f1
          *                  }
          *            }
          * При require модуля B с зависимостью модулем А сначала toJSON будет вызван для
          * функции f1 от объекта А (при загрузке зависимостей)
          * А при загрузке самого модуля В, toJSON для f1 будет вызван от объекта B.K
          * соответственно правильная ссылка будет потеряна.
          */
         makeSerializable = function(depth, obj, moduleName, prefix?) {
            if (depth === 0) {
               return;
            }
            depth--;

            switch (obj && typeof obj) {
               case 'function':
                  if (!obj.hasOwnProperty('toJSON')) {
                     let moduleNameFromProto = obj.prototype && obj.prototype.hasOwnProperty('_moduleName') && obj.prototype._moduleName;
                     if (moduleNameFromProto) {
                        moduleNameFromProto = String(moduleNameFromProto);
                        if (moduleNameFromProto.indexOf(':') > -1) {
                           [moduleName, prefix] = moduleNameFromProto.split(':', 2);
                        }
                     }
                     makeFunctionSerializable(obj, moduleName, prefix);
                  }
                  if (obj.constructor) {
                     makeObjectSerializable(obj, moduleName, prefix, depth);
                  }
                  break;

               case 'object':
                  if (Array.isArray(obj)) {
                     makeArraySerializable(obj, moduleName, prefix, depth);
                  } else if (Object.getPrototypeOf(obj) === Object.prototype) {
                     // is plain Object
                     makeObjectSerializable(obj, moduleName, prefix, depth);
                  }
                  break;
            }
         };

      return function(context, map) {
         let prefix = map.prefix || '';
         if (!prefix || prefix === 'js') {
            let exports = context.defined[map.id];
            let moduleName = map.name;

            if (prefix) {
               prefix += '!';
            }

            makeSerializable(4, exports, prefix + moduleName);
         }

         if (source) {
            source.apply(this, arguments);
         }
      };
   })(require.onResourceLoad);
};

let pathApplied = false;

let patchRequireJS:any = function() {
   const require = getInstance();
   if (require && !pathApplied) {
      pathApplied = true;

      // Undefine failed modules on server side
      if (typeof window === 'undefined') {
         registerErrorHandler(require);
      }

      registerResourceLoadCallback(require);
   }
};

patchRequireJS.getInstance = getInstance;
patchRequireJS.undefineFailed = undefineFailed;

export = patchRequireJS;
