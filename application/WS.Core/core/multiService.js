/**
 * Work with multi-service architecture
 * @author Мальцев А.А.
 */
define('Core/multiService', [
], function(
) {
   var GLOBAL = this || (0, eval)('this');

   return {
      /**
       * Returns list of loaded services
       * @return {String[]}
       */
      getLoadedServices: function() {
         // Try to look in contents.loadedServices created by config.js
         if (GLOBAL && GLOBAL.contents && GLOBAL.contents.loadedServices) {
            return Object.keys(GLOBAL.contents.loadedServices);
         }

         return [];
      }
   };
});
