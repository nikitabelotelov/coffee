define('Core/moduleStubs', [
   'require',
   'Core/constants',
   'Core/Deferred',
   'View/Executor/Utils',
   'Core/patchRequireJS',
   'Core/library'
], function(
   require,
   constants,
   Deferred,
   Utils,
   patchRequireJS,
   library
) {

   'use strict';

   var global = (function() {
         return this || (0, eval)('this');
      }()),
      moduleStubs;
   var modules = Object.create(null);

   global.SBIS3 = {};
   global.SBIS3.CORE = {};

   function getModsFromLibrary(lib, path, name) {
      var mod = lib;
      if (path.length !== 0) {
         path.forEach(function(property) {
            if (mod && typeof mod === 'object' && property in mod) {
               mod = mod[property];
            } else {
               throw new ReferenceError('Cannot find module "' + path.join('.') + '" in library "' + name + '".');
            }
         });
      }
      return mod;
   }

   moduleStubs = {
      requireModule: function(mods) {
         mods = mods instanceof Array ? mods : [mods];
         var modules = [];
         mods.forEach(function(mod) {
            modules.push(mod);
         });
         return moduleStubs.require(modules);
      },
      require: function(modulesArg) {
         var
            dReady = new Deferred(),
            isResultSet = false,
            mods = modulesArg instanceof Array ? modulesArg : [modulesArg],
            resultMods = new Array(mods.length),
            idsToLoad = [],
            idsName = {},
            fireResult = function() {
               var
                  nameArray,
                  moduleName,
                  glob;

               for (var idx = 0; idx < arguments.length; idx++) {
                  var
                     mod = arguments[idx],
                     modIdx = idsToLoad[idx];
                  if (mod) {
                     var lib = library.parse(idsName[modIdx]);
                     resultMods[modIdx] = getModsFromLibrary(mod, lib.path, lib.name);
                  } else {
                     resultMods[modIdx] = mod;
                  }
               }
               mods.forEach(function(mod, index) {
                  if (mod) {
                     glob = modules;
                     nameArray = /[^!]*$/.exec(mod)[0].split('.');
                     moduleName = nameArray.pop();
                     nameArray.forEach(function(elem) {
                        glob = glob[elem] = glob[elem] || {};
                     });
                     modules[moduleName] = resultMods[index];
                  }
               });

               dReady.callback(resultMods);
            },
            modsToLoad;

         dReady.addErrback(function(e) {
            return e;
         });
         mods.forEach(function(mod, idx) {
            var lib = library.parse(mod);
            // На серверном скрипте не надо проверять defined. работаем как есть
            if (!constants.isServerScript && Utils.RequireHelper.defined(mod)) {
               resultMods[idx] = require(lib.name);
            } else {
               idsToLoad.push(idx);
               idsName[idx] = mod;
            }
         });

         if (idsToLoad.length > 0) {
            modsToLoad = idsToLoad.map(function(id) {
               var lib = library.parse(mods[id]);
               return lib.name;
            });

            require(modsToLoad, fireResult, function(err) {
               patchRequireJS.undefineFailed(err);
               if (!isResultSet) {
                  isResultSet = true;
                  dReady.errback(err);
               }
            });
         } else {
            fireResult(modsToLoad);
         }

         return dReady;
      }
   };

   return moduleStubs;
});
