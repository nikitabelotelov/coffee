/* global define */
define('WS.Data/Format/StringField', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/StringField', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.StringField instead.');

   return type.format.StringField;
});
