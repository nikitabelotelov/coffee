(function() {

   "use strict";

   var global = (function() {
         return this || (0, eval)('this');
      }()),
      isControl = /^(Resources\/)?(Controls|SBIS3\.CONTROLS)\//,
      define = global.define || (global.requirejs && global.requirejs.define) || (requirejsVars && requirejsVars.define);
   
   function itIsControl(name) {
      return name.match(isControl);
   }

   /**
    * Достаём из конфигурации тему. Если конфигурация отсутствует или
    * отсутствует свойство themeName, значит считаем, что работаем с онлайном и
    * позволяем грузить онлайновские контролы.
    * @param name
    * @returns {string}
    */
   function resolveSuffix(name) {
      var config = window.wsConfig;

      if (!config) {
         return '';
      }
      if (itIsControl(name) && config.themeName) {
         return '__' + config.themeName;
      }
      else {
         return '';
      }
   }

   define('css', ['native-css', 'Core/pathResolver', 'Env/Env'], function(cssAPI, pathResolver) {
      var EXT_MATCH = /\.css(\?.*)?$/;

      return {
         load: function(name, require, load, conf) {
            if (typeof window !== 'undefined' && window._ignoredModules) {
               for (var i=0;i<window._ignoredModules.length;i++) {
                  if (window._ignoredModules[i].test(name)) {
                     load(true);
                     return;
                  }
               }
            }
            if (conf.testing || require.isBrowser === false) {
               load(true);
            } else {
               var suffix = resolveSuffix(name);
               if (suffix) {
                  load(null);
                  return;
               }

               var path = name;
               if (!name.match(EXT_MATCH)) {
                  path = pathResolver(name, 'css', true);
               }
               cssAPI.load(path, require, load, conf);
            }
         }
      };
   });

})();
