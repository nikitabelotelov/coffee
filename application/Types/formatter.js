/// <amd-module name="Types/formatter" />
/**
 * Библиотека для форматирования.
 * @library Types/object
 * @includes cyrTranslit Types/_object/cyrTranslit
 * @includes date Types/_object/date
 * @includes jsonReplacer Types/_object/jsonReplacer
 * @includes jsonReviver Types/_object/jsonReviver
 * @includes numberRoman Types/_object/numberRoman
 * @includes numberWords Types/_object/numberWords
 * @includes string Types/_object/number
 * @public
 * @author Мальцев А.А.
 */
define('Types/formatter', [
    'require',
    'exports',
    'Types/_formatter/cyrTranslit',
    'Types/_formatter/date',
    'Types/_formatter/dateToSql',
    'Types/_formatter/dateFromSql',
    'Types/_formatter/dateToSql',
    'Types/_formatter/jsonReplacer',
    'Types/_formatter/jsonReviver',
    'Types/_formatter/numberRoman',
    'Types/_formatter/numberWords',
    'Types/_formatter/number'
], function (require, exports, cyrTranslit_1, date_1, dateToSql_1, dateFromSql_1, dateToSql_2, jsonReplacer_1, jsonReviver_1, numberRoman_1, numberWords_1, number_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.cyrTranslit = cyrTranslit_1.default;
    exports.date = date_1.default;
    exports.dateToSql = dateToSql_1.default;
    exports.dateFromSql = dateFromSql_1.default;
    exports.TO_SQL_MODE = dateToSql_2.MODE;
    exports.jsonReplacer = jsonReplacer_1.default;
    exports.jsonReviver = jsonReviver_1.default;
    exports.numberRoman = numberRoman_1.default;
    exports.numberWords = numberWords_1.default;
    exports.number = number_1.default;
});