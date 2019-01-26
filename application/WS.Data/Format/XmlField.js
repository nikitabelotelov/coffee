/* global define */
define('WS.Data/Format/XmlField', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/XmlField', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.XmlField instead.');

   return type.format.XmlField;
});
