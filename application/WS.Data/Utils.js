/* global define */

/**
 * Набор утилит.
 * @module WS.Data/Utils
 * @public
 * @author Мальцев А.А.
 */
define('WS.Data/Utils', [
   'Types/util'
], function(
   util
) {
   util.logger.error('WS.Data/Utils', 'Module is deprecated and will be removed in 19.200. Use Types/util instead.');

   return {
      getItemPropertyValue: util.object.getPropertyValue,
      setItemPropertyValue: util.object.setPropertyValue,
      clone: util.object.clone,
      clonePlain: util.object.clonePlain,
      protected: util.protect,
      logger: util.logger
   };
});
