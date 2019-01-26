/* global define */
define('WS.Data/Source/Local', [
   'Types/source',
   'Types/util',
   'Core/core-extend'
], function(
   source,
   util,
   extend
) {
   'use strict';

   util.logger.error('WS.Data/Source/Local', 'Module is deprecated and will be removed in 19.200. Use Types/source:Local instead.');

   var Local = extend.extend(source.Local, {
      '[WS.Data/Source/Local]': true,

      // region Deprecated

      getBinding: function() {
         return {};
      },

      setBinding: function() {
      }

      // endregion Deprecated
   });

   return Local;
});
