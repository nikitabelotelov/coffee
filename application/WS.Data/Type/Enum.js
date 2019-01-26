/* global define */
define('WS.Data/Type/Enum', [
   'Types/collection',
   'Types/util',
   'WS.Data/Di'
], function(
   collection,
   util,
   Di
) {
   'use strict';

   util.logger.error('WS.Data/Type/Enum', 'Module is deprecated and will be removed in 19.200. Use Types/collection:Enum instead.');

   // Deprecated
   Di.register('types.$enum', collection.Enum, {instantiate: false});
   Di.register('types.enum', collection.Enum);
   Di.register('data.types.enum', collection.Enum);

   return collection.Enum;
});
