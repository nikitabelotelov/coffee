/* global define */
define('WS.Data/Format/FieldsFactory', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/FieldsFactory', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.fieldsFactory instead.');

   return type.format.fieldsFactory;
});
