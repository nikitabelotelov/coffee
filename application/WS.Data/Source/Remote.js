/* global define */
define('WS.Data/Source/Remote', [
   'Types/source',
   'Types/util',
   'Core/core-extend'
], function(
   source,
   util,
   extend
) {
   'use strict';

   util.logger.error('WS.Data/Source/Remote', 'Module is deprecated and will be removed in 19.200. Use Types/source:Remote instead.');

   var Remote = extend.extend(source.Remote, {
      '[WS.Data/Source/Remote]': true,

      constructor: function(options) {
         Remote.superclass.constructor.call(this, options);

         // FIXME: backward compatibility
         if (this._prepareCreateArguments) {
            this._$passing.create = this._prepareCreateArguments;
         }
         if (this._prepareReadArguments) {
            this._$passing.read = this._prepareReadArguments;
         }
         if (this._prepareUpdateArguments) {
            this._$passing.update = this._prepareUpdateArguments;
         }
         if (this._prepareDestroyArguments) {
            this._$passing.destroy = this._prepareDestroyArguments;
         }
         if (this._prepareQueryArguments) {
            this._$passing.query = this._prepareQueryArguments;
         }
         if (this._prepareMergeArguments) {
            this._$passing.merge = this._prepareMergeArguments;
         }
         if (this._prepareCopyArguments) {
            this._$passing.copy = this._prepareCopyArguments;
         }
         if (this._prepareMoveArguments) {
            this._$passing.move = this._prepareMoveArguments;
         }
      }
   });

   Remote.prototype.NAVIGATION_TYPE = source.Remote.NAVIGATION_TYPE;

   return Remote;
});