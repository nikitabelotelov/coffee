/// <amd-module name="Types/chain" />
/**
 * Библиотека последовательных вычислений, обрабатывающих коллекции различных типов.
 * @library Types/chain
 * @includes factory Types/_chain/factory
 * @public
 * @author Мальцев А.А.
 */
define('Types/chain', [
    'require',
    'exports',
    'Types/_chain/factory',
    'Types/_chain/Abstract',
    'Types/_chain/Objectwise'
], function (require, exports, factory_1, Abstract_1, Objectwise_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.factory = factory_1.default;
    exports.Abstract = Abstract_1.default;
    exports.Objectwise = Objectwise_1.default;
});