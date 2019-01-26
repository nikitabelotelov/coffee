/// <amd-module name="Types/_entity/VersionableMixin" />
/**
 * Миксин, позволяющий получать и измениять номер версии объекта.
 * @mixin Types/Entity/VersionableMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/VersionableMixin', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var VersionableMixin = /** @lends Types/Entity/VersionableMixin.prototype */
    {
        '[Types/_entity/VersionableMixin]': true,
        //region IVersionable
        _version: 0,
        getVersion: function () {
            return this._version;
        },
        _nextVersion: function () {
            this._version++;
            if (this['[Types/_entity/ManyToManyMixin]']) {
                this._getMediator().belongsTo(this, function (parent) {
                    if (parent && parent['[Types/_entity/IVersionable]']) {
                        parent._nextVersion();
                    }
                });
            }
        }    //endregion IVersionable
    };
    //endregion IVersionable
    exports.default = VersionableMixin;
});