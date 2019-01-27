///<amd-module name="Types/_entity/date/toSql" />
/**
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/date/toSql', [
    'require',
    'exports',
    'Types/formatter'
], function (require, exports, formatter_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var MODE = {
        'TIME': 'time',
        'DATE': 'date',
        'DATETIME': 'datetime'
    };
    exports.MODE = MODE;
    var modeFormat = {
        'time': 'HH:mm:ss',
        'date': 'YYYY-MM-DD',
        'datetime': 'YYYY-MM-DD HH:mm:ss'
    };
    var UNIX_EPOCH_START = new Date(0);    /**
     * Приводит объект Date() к строке, содержащей дату в формате SQL.
     * @function
     * @name Types/_entity/date/toSql
     * @param {Date} date Дата
     * @param {SerializeMode} [mode=MODE_DATETIME] Режим сериализации.
     * @return {String}
     */
    /**
     * Приводит объект Date() к строке, содержащей дату в формате SQL.
     * @function
     * @name Types/_entity/date/toSql
     * @param {Date} date Дата
     * @param {SerializeMode} [mode=MODE_DATETIME] Режим сериализации.
     * @return {String}
     */
    function getTimeZone(date) {
        var tz = -date.getTimezoneOffset() / 60, isNegative = tz < 0;
        if (isNegative) {
            tz = -tz;
        }
        return (isNegative ? '-' : '+') + (tz < 10 ? '0' : '') + tz;
    }
    function toSQL(date, mode) {
        if (mode === void 0) {
            mode = MODE.DATETIME;
        }
        var result = formatter_1.date(date, modeFormat[mode]);
        if (mode !== MODE.DATE && date > UNIX_EPOCH_START) {
            if (date.getMilliseconds() > 0) {
                result += '.' + date.getMilliseconds();
            }
            result += getTimeZone(date);
        }
        return result;
    }
    exports.default = toSQL;
    ;
});