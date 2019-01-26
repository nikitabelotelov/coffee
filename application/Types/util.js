/// <amd-module name="Types/util" />
/**
 * Библиотека утилит.
 * @library Types/util
 * @includes object Types/_util/object
 * @includes logger Types/_util/logger
 * @includes mixin Types/_util/mixin
 * @includes protect Types/_util/protect
 * @public
 * @author Мальцев А.А.
 */
define('Types/util', [
    'require',
    'exports',
    'Types/_util/logger',
    'Types/_util/object',
    'Types/_util/mixin',
    'Types/_util/protect'
], function (require, exports, logger_1, object_1, mixin_1, protect_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.logger = logger_1.default;
    exports.object = object_1.default;
    exports.mixin = mixin_1.mixin;
    exports.applyMixins = mixin_1.applyMixins;
    exports.protect = protect_1.default;
});