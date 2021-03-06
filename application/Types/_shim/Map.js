/// <amd-module name="Types/_shim/Map" />
/**
 * Limited emulation of standard built-in object "Map" if it's not supported.
 * Follow {@link https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Map} for details.
 * @author Мальцев А.А.
 */
define('Types/_shim/Map', [
    'require',
    'exports',
    'Types/_shim/Set'
], function (require, exports, Set_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    // Use native implementation if supported
    // Use native implementation if supported
    var MapImplementation;
    if (typeof Map === 'undefined') {
        MapImplementation = /** @class */
        function () {
            function class_1() {
                this.clear();
            }
            class_1._getUnhashedKey = function (key) {
                return String(key).split('@', 2)[1];
            };
            class_1.prototype.clear = function () {
                this._hash = {};
                this._objects = [];
            };
            class_1.prototype.delete = function (key) {
                var surrogate;
                if (this._isObject(key)) {
                    surrogate = this._addObject(key);
                    if (!surrogate) {
                        return;
                    }
                } else {
                    surrogate = key;
                }    // @ts-ignore
                // @ts-ignore
                this._hash[Set_1.default._getHashedKey(surrogate)] = undefined;
            };
            class_1.prototype.entries = function () {
                throw new Error('Method is not supported');
            };
            class_1.prototype.forEach = function (callbackFn, thisArg) {
                // FIXME: now not in insertion order
                var hash = this._hash;
                var ukey;
                var value;
                for (var key in hash) {
                    if (hash.hasOwnProperty(key) && hash[key] !== undefined) {
                        value = hash[key];
                        ukey = MapImplementation._getUnhashedKey(key);
                        if (this._isObjectKey(ukey)) {
                            ukey = this._getObject(ukey);
                        }
                        callbackFn.call(thisArg, value, ukey, this);
                    }
                }
            };
            class_1.prototype.get = function (key) {
                var surrogate;
                if (this._isObject(key)) {
                    surrogate = this._getObjectKey(key);
                    if (!surrogate) {
                        return;
                    }
                } else {
                    surrogate = key;
                }    // @ts-ignore
                // @ts-ignore
                return this._hash[Set_1.default._getHashedKey(surrogate)];
            };
            class_1.prototype.has = function (key) {
                var surrogate;
                if (this._isObject(key)) {
                    surrogate = this._getObjectKey(key);
                    if (!surrogate) {
                        return false;
                    }
                } else {
                    surrogate = key;
                }    // @ts-ignore
                // @ts-ignore
                surrogate = Set_1.default._getHashedKey(surrogate);
                return this._hash.hasOwnProperty(surrogate) && this._hash[surrogate] !== undefined;
            };
            class_1.prototype.keys = function () {
                throw new Error('Method is not supported');
            };
            class_1.prototype.set = function (key, value) {
                var surrogate;
                if (this._isObject(key)) {
                    surrogate = this._addObject(key);
                } else {
                    surrogate = key;
                }    // @ts-ignore
                // @ts-ignore
                this._hash[Set_1.default._getHashedKey(surrogate)] = value;
                return this;
            };
            class_1.prototype._isObject = function (value) {
                // @ts-ignore
                return Set_1.default.prototype._isObject.call(this, value);
            };
            class_1.prototype._addObject = function (value) {
                // @ts-ignore
                return Set_1.default.prototype._addObject.call(this, value);
            };
            class_1.prototype._deleteObject = function (value) {
                // @ts-ignore
                return Set_1.default.prototype._deleteObject.call(this, value);
            };
            class_1.prototype._getObjectKey = function (value) {
                // @ts-ignore
                return Set_1.default.prototype._getObjectKey.call(this, value);
            };
            class_1.prototype._isObjectKey = function (key) {
                return String(key).substr(0, this._objectPrefix.length) === this._objectPrefix;
            };
            class_1.prototype._getObject = function (key) {
                var index = parseInt(key.substr(this._objectPrefix.length), 10);
                return this._objects[index];
            };
            return class_1;
        }();
        Object.assign(MapImplementation.prototype, {
            _hash: null,
            _objectPrefix: Set_1.default.prototype._objectPrefix,
            _objects: null
        });
        Object.defineProperty(MapImplementation.prototype, 'size', {
            get: function () {
                return Object.keys(this._hash).length;
            },
            enumerable: true,
            configurable: false
        });
    } else {
        MapImplementation = Map;
    }
    exports.default = MapImplementation;
});