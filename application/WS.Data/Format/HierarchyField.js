/* global define */
define('WS.Data/Format/HierarchyField', [
   'Types/entity',
   'WS.Data/Utils'
], function(
   type,
   Utils
) {
   'use strict';

   Utils.logger.error('WS.Data/Format/HierarchyField', 'Module has been removed in 3.18.10. Use WS.Data/Format/IdentityField instead.');

   return type.format.HierarchyField;
});
