/* global define */
define('WS.Data/Type/Flags', [
   'Types/collection',
   'Types/util',
   'WS.Data/Di'
], function(
   collection,
   util,
   Di
) {
   'use strict';

   util.logger.error('WS.Data/Type/Flags', 'Module is deprecated and will be removed in 19.200. Use Types/collection:Flags instead.');

   // Deprecated
   Di.register('types.$flags', collection.Flags, {instantiate: false});
   Di.register('types.flags', collection.Flags);
   Di.register('data.types.flags', collection.Flags);

   return collection.Flags;
});
