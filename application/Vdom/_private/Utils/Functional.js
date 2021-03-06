/// <amd-module name="Vdom/_private/Utils/Functional" />
define('Vdom/_private/Utils/Functional', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Преобразуем аргументы вызова функции к честному массиву
     * @param argumentsObj
     * @returns {Array}
     */
    /**
     * Преобразуем аргументы вызова функции к честному массиву
     * @param argumentsObj
     * @returns {Array}
     */
    function argumentsToArray(argumentsObj) {
        var ln = argumentsObj.length, args = new Array(ln), i;
        if (typeof ln !== 'number') {
            throw new Error('argumentsToArray - wrong arg');
        }
        for (i = 0; i !== ln; i++) {
            args[i] = argumentsObj[i];
        }
        return args;
    }
    exports.argumentsToArray = argumentsToArray;    /**
     * Собирает результаты вызовов прокидывая их в вызов следующей фукнкции
     * @param {Function|Function[]} fn - функция или массив функций
     * @returns {Function}
     */
    /**
     * Собирает результаты вызовов прокидывая их в вызов следующей фукнкции
     * @param {Function|Function[]} fn - функция или массив функций
     * @returns {Function}
     */
    function composeWithResultApply(fn) {
        var functions = Array.isArray(fn) ? fn : argumentsToArray(arguments), funcsLn = functions.length;
        return function () {
            var res = functions[funcsLn - 1].apply(this, arguments), i;
            for (i = funcsLn - 2; i >= 0; i--) {
                res = res instanceof Array ? functions[i].apply(this, res) : functions[i].call(this, res);
            }
            return res;
        };
    }
    exports.composeWithResultApply = composeWithResultApply;    /**
     * Осуществляет поиск функции через проход по прототипам вверх
     * Вызывает callback для этих методов начиная с базового класса
     * @param classFn - класс
     * @param funcName - имя функции
     * @param reduceFn - callback
     * @param memo
     * @returns {*}
     */
    /**
     * Осуществляет поиск функции через проход по прототипам вверх
     * Вызывает callback для этих методов начиная с базового класса
     * @param classFn - класс
     * @param funcName - имя функции
     * @param reduceFn - callback
     * @param memo
     * @returns {*}
     */
    function reduceHierarchyFunctions(classFn, funcName, reduceFn, memo) {
        var proto = classFn.prototype, result = memo, funcs = [], i, func;
        while (proto && proto.constructor) {
            if (proto.hasOwnProperty(funcName) && typeof proto[funcName] === 'function') {
                func = proto[funcName];
                if (func) {
                    funcs.push(func);
                }
            }
            proto = proto.constructor.superclass;
        }
        for (i = funcs.length - 1; i !== -1; i--) {
            result = reduceFn(result, funcs[i]);
        }
        return result;
    }
    exports.reduceHierarchyFunctions = reduceHierarchyFunctions;    /**
     * Возвращает функцию вызывающую последовательно все методы от предка до текщуего класса
     * @param classFn - класс
     * @param funcName - имя функции
     * @returns {Function}
     */
    /**
     * Возвращает функцию вызывающую последовательно все методы от предка до текщуего класса
     * @param classFn - класс
     * @param funcName - имя функции
     * @returns {Function}
     */
    function composeHierarchyFunctions(classFn, funcName) {
        var funcs = getHierarchyFunctions(classFn, funcName);
        return composeWithResultApply(funcs);
    }
    exports.composeHierarchyFunctions = composeHierarchyFunctions;    /**
     * Возвращает список всех функций по иерархии
     * @param classFn - класс
     * @param funcName - имя метода
     * @returns {*}
     */
    /**
     * Возвращает список всех функций по иерархии
     * @param classFn - класс
     * @param funcName - имя метода
     * @returns {*}
     */
    function getHierarchyFunctions(classFn, funcName) {
        var funcs = reduceHierarchyFunctions(classFn, funcName, function (result, fn) {
            result.unshift(fn);
            return result;
        }, []);
        return funcs;
    }
    exports.getHierarchyFunctions = getHierarchyFunctions;
    function assert(cond, msg) {
        var message;
        if (!cond) {
            message = typeof msg == 'function' ? msg() : msg;
            throw new Error(message || 'assert');
        }
    }
    exports.assert = assert;
});