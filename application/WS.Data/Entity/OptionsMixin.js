/* global define */
define('WS.Data/Entity/OptionsMixin', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Entity/OptionsMixin', 'Module is deprecated and will be removed in 19.200. Use Types/entity:OptionsToPropertyMixin instead.');

   return type.OptionsToPropertyMixin.prototype;
});
