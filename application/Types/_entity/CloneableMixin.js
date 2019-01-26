/// <amd-module name="Types/_entity/CloneableMixin" />
/**
 * Миксин, позволяющий клонировать объекты.
 * Для корректной работы требуется подмешать {@link Types/Entity/SerializableMixin}.
 * @mixin Types/Entity/CloneableMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/CloneableMixin', [
    'require',
    'exports',
    'Core/Serializer'
], function (require, exports, Serializer) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var CloneableMixin = /** @lends Types/Entity/CloneableMixin.prototype */
    {
        '[Types/_entity/CloneableMixin]': true,
        //region Types/Entity/ICloneable
        '[Types/_entity/ICloneable]': true,
        clone: function (shallow) {
            var clone;
            if (shallow) {
                var proto = Object.getPrototypeOf(this);
                var Module = proto.constructor;
                var data = this.toJSON();
                data.state = this._unlinkCollection(data.state);
                if (data.state.$options) {
                    data.state.$options = this._unlinkCollection(data.state.$options);
                }
                clone = Module.prototype.fromJSON.call(Module, data);
            } else {
                var serializer = new Serializer();
                clone = JSON.parse(JSON.stringify(this, serializer.serialize), serializer.deserialize);
            }    //TODO: this should be do instances mixes InstantiableMixin
            //TODO: this should be do instances mixes InstantiableMixin
            delete clone._instanceId;
            return clone;
        },
        //endregion Types/Entity/ICloneable
        //region Protected methods
        _unlinkCollection: function (collection) {
            var result;
            if (collection instanceof Array) {
                result = [];
                for (var i = 0; i < collection.length; i++) {
                    result[i] = this._unlinkObject(collection[i]);
                }
                return result;
            }
            if (collection instanceof Object) {
                result = {};
                for (var key in collection) {
                    if (collection.hasOwnProperty(key)) {
                        result[key] = this._unlinkObject(collection[key]);
                    }
                }
                return result;
            }
            return collection;
        },
        _unlinkObject: function (object) {
            if (object instanceof Array) {
                return object.slice();
            }
            return object;
        }    //endregion Protected methods
    };
    //endregion Protected methods
    exports.default = CloneableMixin;
});