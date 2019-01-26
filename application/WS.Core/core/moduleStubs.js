define('Core/moduleStubs', [
   'require',
   'Core/constants',
   'Core/Deferred',
   'View/Executor/Utils',
   'Core/patchRequireJS'
], function(
   require,
   constants,
   Deferred,
   Utils,
   patchRequireJS
) {

   'use strict';

   var global = (function() {
         return this || (0, eval)('this');
      }()),
      moduleStubs;
   var modules = Object.create(null);

   global.SBIS3 = {};
   global.SBIS3.CORE = {};

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
            fireResult = function() {
               var
                  nameArray,
                  moduleName,
                  glob;

               for (var idx = 0; idx < arguments.length; idx++) {
                  var
                     mod = arguments[idx],
                     modIdx = idsToLoad[idx];
                  resultMods[modIdx] = mod;
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
            // На серверном скрипте не надо проверять defined. работаем как есть
            if (!constants.isServerScript && Utils.RequireHelper.defined(mod)) {
               resultMods[idx] = require(mod);
            } else {
               idsToLoad.push(idx);
            }
         });

         if (idsToLoad.length > 0) {
            modsToLoad = idsToLoad.map(function(id) {
               return mods[id];
            });

            require(modsToLoad, fireResult, function(err) {
               patchRequireJS.undefineFailed(err);
               if (!isResultSet) {
                  isResultSet = true;
                  dReady.errback(err);
               }
            });
         } else {
            fireResult();
         }

         return dReady;
      }
   };

   return moduleStubs;
});
