/// <amd-module name="Types/_object/merge" />
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
define('Types/_object/merge', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    function isObject(obj) {
        return obj !== null && typeof obj === 'object';
    }
    function merge(target) {
        var sources = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            sources[_i - 1] = arguments[_i];
        }
        if (isObject(target)) {
            sources.forEach(function (source) {
                if (isObject(source)) {
                    var overrides_1 = {};
                    Object.keys(source).forEach(function (key) {
                        if (isObject(source[key])) {
                            if (target.hasOwnProperty(key)) {
                                overrides_1[key] = merge(target[key], source[key]);
                            }
                        }
                    });
                    Object.assign(target, source, overrides_1);
                }
            });
        }
        return target;
    }
    exports.default = merge;
});