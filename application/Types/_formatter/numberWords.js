define('Types/_formatter/numberWords', [
    'require',
    'exports',
    'Types/_formatter/_numberWords/ru',
    'Types/_formatter/_numberWords/en',
    'Core/i18n'
], function (require, exports, ru_1, en_1, i18n) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    function numberWords(num, feminine) {
        if (feminine === void 0) {
            feminine = false;
        }
        num = String(num);
        switch (i18n.getLang()) {
        case 'ru-RU':
            return ru_1.default(num, feminine);
        case 'en-US':
        default:
            return en_1.default(num);
        }
    }
    exports.default = numberWords;
});