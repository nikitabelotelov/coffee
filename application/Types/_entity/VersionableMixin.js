/// <amd-module name="Types/_entity/VersionableMixin" />
/**
 * Миксин, позволяющий получать и измениять номер версии объекта.
 * @mixin Types/_entity/VersionableMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/VersionableMixin', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var VersionableMixin = /** @lends Types/_entity/VersionableMixin.prototype */
    {
        '[Types/_entity/VersionableMixin]': true,
        // region IVersionable
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
        }    // endregion
    };
    // endregion
    exports.default = VersionableMixin;
});