/// <amd-module name="Types/_object/merge" />
define('Types/_object/merge', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    function isObject(obj) {
        return obj !== null && typeof obj === 'object';
    }    /**
     *
     * Модуль, в котором описана функция <b>merge.ts(obj1[, obj2, ...])</b>,
     *
     * Функция рекурсивно объединяет два или более объектов.
     *
     * <h2>Параметры функции</h2>
     *
     * <ul>
     *   <li><b>target</b> {Object}.</li>
     *   <li><b>sources</b> {Object}.</li>
     * </ul>
     *
     * <h2>Пример использования</h2>
     * <pre>
     *    require(['Types/object'], function(util) {
     *       // true
     *       console.log(object.merge({foo: {data:'bar'}}, {foo: {myData:'bar'}})); //{foo: {data:'bar', myData:'bar'}}
     *
     *       // false
     *       console.log(util.isEqual([0], ['0']));
     *    });
     * </pre>
     *
     * @class Types/_object/merge
     * @public
     * @author Мальцев А.А.
     */
    /**
     *
     * Модуль, в котором описана функция <b>merge.ts(obj1[, obj2, ...])</b>,
     *
     * Функция рекурсивно объединяет два или более объектов.
     *
     * <h2>Параметры функции</h2>
     *
     * <ul>
     *   <li><b>target</b> {Object}.</li>
     *   <li><b>sources</b> {Object}.</li>
     * </ul>
     *
     * <h2>Пример использования</h2>
     * <pre>
     *    require(['Types/object'], function(util) {
     *       // true
     *       console.log(object.merge({foo: {data:'bar'}}, {foo: {myData:'bar'}})); //{foo: {data:'bar', myData:'bar'}}
     *
     *       // false
     *       console.log(util.isEqual([0], ['0']));
     *    });
     * </pre>
     *
     * @class Types/_object/merge
     * @public
     * @author Мальцев А.А.
     */
    function merge(target) {
        var sources = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            sources[_i - 1] = arguments[_i];
        }
        var _a, _b;
        if (!sources.length) {
            return target;
        }
        var source = sources.shift();
        if (isObject(target) && isObject(source)) {
            for (var key in source) {
                if (isObject(source[key])) {
                    if (!target[key]) {
                        Object.assign(target, (_a = {}, _a[key] = {}, _a));
                    }
                    merge(target[key], source[key]);
                } else {
                    Object.assign(target, (_b = {}, _b[key] = source[key], _b));
                }
            }
        }
        return merge.apply(void 0, [target].concat(sources));
    }
    exports.default = merge;
});