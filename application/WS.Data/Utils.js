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
   return {
      getItemPropertyValue: util.object.getPropertyValue,
      setItemPropertyValue: util.object.setPropertyValue,
      clone: util.object.clone,
      clonePlain: util.object.clonePlain,
      protected: util.protect,
      logger: util.logger
   };
});
