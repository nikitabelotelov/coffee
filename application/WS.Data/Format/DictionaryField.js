/* global define */
define('WS.Data/Format/DictionaryField', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/DictionaryField', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.DictionaryField instead.');

   return type.format.DictionaryField;
});
