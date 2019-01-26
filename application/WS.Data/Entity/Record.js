/* global define */
define('WS.Data/Entity/Record', [
   'Types/entity',
   'Types/util',
   'WS.Data/Di',
   'Core/core-extend'
], function(
   entity,
   util,
   di,
   coreExtend
) {
   'use strict';

   util.logger.error('WS.Data/Entity/Record', 'Module is deprecated and will be removed in 19.200. Use Types/entity:Record instead.');

   var Record = entity.Record;

   Record.extend = function(mixinsList, classExtender) {
      return coreExtend.extend(Record, mixinsList, classExtender);
   };

   // Aliases
   Record.prototype._hasChanged = Record.prototype._hasChangedField;
   Record.prototype._setChanged = Record.prototype._setChangedField;
   Record.prototype._unsetChanged = Record.prototype._unsetChangedField;
   Record.prototype._clearPropertiesCache = Record.prototype._clearFieldsCache;

   // Deprecated
   Record.prototype._hasInPropertiesCache = function(name) {
      return this._fieldsCache.has(name);
   };
   Record.prototype._getFromPropertiesCache = function(name) {
      return this._fieldsCache.get(name);
   };
   Record.prototype._setToPropertiesCache = function(name, value) {
      this._fieldsCache.set(name, value);
   };
   Record.prototype._unsetFromPropertiesCache = function(name) {
      this._fieldsCache.delete(name);
   };

   di.register('entity.$record', Record, {instantiate: false});
   di.register('entity.record', Record);

   return Record;
});
