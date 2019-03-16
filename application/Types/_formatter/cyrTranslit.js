define('Types/_formatter/cyrTranslit', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /// <amd-module name="Types/_formatter/cyrTranslit" />
                                                                      /**
     * Выполняет транслитерацию строки. Заменяет пробелы на _, вырезает мягкий и твердый знаки.
     * @param {String} string Исходная строка для преобразования.
     * @returns {String}
     */
    /// <amd-module name="Types/_formatter/cyrTranslit" />
    /**
     * Выполняет транслитерацию строки. Заменяет пробелы на _, вырезает мягкий и твердый знаки.
     * @param {String} string Исходная строка для преобразования.
     * @returns {String}
     */
    var charMap = {
        а: 'a',
        б: 'b',
        в: 'v',
        г: 'g',
        д: 'd',
        е: 'e',
        ё: 'e',
        ж: 'j',
        з: 'z',
        и: 'i',
        й: 'j',
        к: 'k',
        л: 'l',
        м: 'm',
        н: 'n',
        о: 'o',
        п: 'p',
        р: 'r',
        с: 's',
        т: 't',
        у: 'u',
        ф: 'f',
        х: 'h',
        ц: 'ts',
        ч: 'ch',
        ш: 'sh',
        щ: 'sch',
        ъ: '',
        ы: 'y',
        ь: '',
        э: 'e',
        ю: 'yu',
        я: 'ya',
        ' ': '_',
        А: 'A',
        Б: 'B',
        В: 'V',
        Г: 'G',
        Д: 'D',
        Е: 'E',
        Ё: 'E',
        Ж: 'J',
        З: 'Z',
        И: 'I',
        Й: 'J',
        К: 'K',
        Л: 'L',
        М: 'M',
        Н: 'N',
        О: 'O',
        П: 'P',
        Р: 'R',
        С: 'S',
        Т: 'T',
        У: 'U',
        Ф: 'F',
        Х: 'H',
        Ц: 'TS',
        Ч: 'CH',
        Ш: 'SH',
        Щ: 'SCH',
        Ъ: '',
        Ы: 'Y',
        Ь: '',
        Э: 'E',
        Ю: 'YU',
        Я: 'YA'
    };
    function cyrTranslit(str) {
        var result = [];
        for (var i = 0, l = str.length; i < l; i++) {
            var char = str[i];
            result[i] = char in charMap ? charMap[char] : char;
        }
        return result.join('');
    }
    exports.default = cyrTranslit;
});