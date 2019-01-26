/// <amd-module name="Types/_function/once" />
define('Types/_function/once', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Модуль, в котором описана функция <b>once(original)</b>.
     *
     * Метод обертки функции: вызовет функцию только один раз.
     * Повторные вызовы результирующей функции будут возвращать результат первого вызова.
     *
     * <h2>Параметры функции</h2>
     * <ul>
     *     <li><b>original</b> {Function} - исходная функция, вызов которой нужно выполнить один раз.</li>
     * </ul>
     *
     * <h2>Возвращает</h2>
     * {Function} Результирующая функция.
     *
     * <h2>Пример использования</h2>
     * <pre>
     * require(['Types/function'], function(util) {
     *    var foo = function(bar) {
     *          console.log(`foo: ${bar}`);
     *          return 'foo+' + bar;
     *       },
     *       fooDecorator = outil.once(foo);
     *
     *    console.log(fooDecorator('baz'));//foo: baz, foo+baz
     *    console.log(fooDecorator('baz'));//foo+baz
     * });
     * </pre>
     *
     * @class Types/_function/once
     * @public
     * @author Мальцев А.А.
     */
    /**
     * Модуль, в котором описана функция <b>once(original)</b>.
     *
     * Метод обертки функции: вызовет функцию только один раз.
     * Повторные вызовы результирующей функции будут возвращать результат первого вызова.
     *
     * <h2>Параметры функции</h2>
     * <ul>
     *     <li><b>original</b> {Function} - исходная функция, вызов которой нужно выполнить один раз.</li>
     * </ul>
     *
     * <h2>Возвращает</h2>
     * {Function} Результирующая функция.
     *
     * <h2>Пример использования</h2>
     * <pre>
     * require(['Types/function'], function(util) {
     *    var foo = function(bar) {
     *          console.log(`foo: ${bar}`);
     *          return 'foo+' + bar;
     *       },
     *       fooDecorator = outil.once(foo);
     *
     *    console.log(fooDecorator('baz'));//foo: baz, foo+baz
     *    console.log(fooDecorator('baz'));//foo+baz
     * });
     * </pre>
     *
     * @class Types/_function/once
     * @public
     * @author Мальцев А.А.
     */
    var storage = new WeakMap();
    function once(original) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (!storage.has(original)) {
                var result = original.apply(this, args);
                storage.set(original, result);
            }
            return storage.get(original);
        };
    }
    exports.default = once;
});