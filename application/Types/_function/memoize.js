/// <amd-module name="Types/_function/memoize" />
define('Types/_function/memoize', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Возвращает функцию, запоминающую результат первого вызова оборачиваемого метода объекта и возвращающую при
     * повторных вызовах единожды вычисленный результат.
     *
     * <h2>Параметры функции</h2>
     * <ul>
     *     <li><b>func</b> {Function} - Метод, результат вызова которого будет запомнен.</li>
     *     <li><b>cachedFuncName</b> {String} - Имя метода в экземпляре объекта, которому он принадлежит.</li>
     * </ul>
     *
     * <h2>Возвращает</h2>
     * {Function} Результирующая функция.
     *
     * @class Types/_function/memoize
     * @public
     * @author Мальцев А.А.
     */
    /**
     * Возвращает функцию, запоминающую результат первого вызова оборачиваемого метода объекта и возвращающую при
     * повторных вызовах единожды вычисленный результат.
     *
     * <h2>Параметры функции</h2>
     * <ul>
     *     <li><b>func</b> {Function} - Метод, результат вызова которого будет запомнен.</li>
     *     <li><b>cachedFuncName</b> {String} - Имя метода в экземпляре объекта, которому он принадлежит.</li>
     * </ul>
     *
     * <h2>Возвращает</h2>
     * {Function} Результирующая функция.
     *
     * @class Types/_function/memoize
     * @public
     * @author Мальцев А.А.
     */
    var storage = new WeakMap();
    var Memoize = /** @class */
    function () {
        function Memoize() {
        }
        Memoize.prototype.memoize = function (original) {
            return function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var cache = {};
                var key = JSON.stringify(args);
                if (storage.has(original)) {
                    cache = storage.get(original);
                } else {
                    storage.set(original, cache);
                }
                if (cache.hasOwnProperty(key)) {
                    return cache[key];
                }
                var result = original.apply(this, args);
                cache[key] = result;
                return result;
            };
        };
        Memoize.prototype.clear = function (original) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (storage.has(this)) {
                var cache = storage.get(original);
                var key = JSON.stringify(args);
                var keyIndex = cache.indexOf(key);
                if (keyIndex > -1) {
                    storage.set(this, cache.splice(keyIndex, 1));
                }
            }
        };
        return Memoize;
    }();
    var instance = new Memoize();
    var memoize = instance.memoize.bind(instance);
    memoize.clear = instance.clear.bind(instance);
    memoize.prototype = { _moduleName: 'Types/_function/memoize' };
    exports.default = memoize;
});