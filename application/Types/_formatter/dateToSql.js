/**
 * Serializes Date to the preferred SQL format.
 * @public
 * @author Мальцев А.А.
 */
define('Types/_formatter/dateToSql', [
    'require',
    'exports',
    'Types/_formatter/date'
], function (require, exports, date_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var MODE = {
        TIME: 'time',
        DATE: 'date',
        DATETIME: 'datetime'
    };
    exports.MODE = MODE;
    var FORMAT = {
        time: 'HH:mm:ss',
        date: 'YYYY-MM-DD',
        datetime: 'YYYY-MM-DD HH:mm:ss'
    };
    var MINUTES_IN_HOUR = 60;
    var UNIX_EPOCH_START = new Date(0);    /**
     * Adds symbols to the left side of string until it reaches desired length
     */
    /**
     * Adds symbols to the left side of string until it reaches desired length
     */
    function strPad(input, size, pattern) {
        var output = String(input);
        if (pattern.length > 0) {
            while (output.length < size) {
                output = pattern + output;
            }
        }
        return output;
    }    /**
     * Returns time zone offset in [+-]HH or [+-]HH:mm format
     */
    /**
     * Returns time zone offset in [+-]HH or [+-]HH:mm format
     */
    function getTimeZone(date) {
        var totalMinutes = date.getTimezoneOffset();
        var isEast = totalMinutes <= 0;
        if (totalMinutes < 0) {
            totalMinutes = -totalMinutes;
        }
        var hours = Math.floor(totalMinutes / MINUTES_IN_HOUR);
        var minutes = totalMinutes - MINUTES_IN_HOUR * hours;
        var size = 2;
        hours = strPad(hours, size, '0');
        if (minutes === 0) {
            minutes = '';
        } else {
            minutes = strPad(minutes, size, '0');
        }
        return '' + (isEast ? '+' : '-') + hours + (minutes ? ':' + minutes : '');
    }
    function toSQL(date, mode) {
        if (mode === void 0) {
            mode = MODE.DATETIME;
        }
        var result = date_1.default(date, FORMAT[mode]);
        if (mode !== MODE.DATE && date > UNIX_EPOCH_START) {
            // Add milliseconds
            if (date.getMilliseconds() > 0) {
                result += '.' + strPad(date.getMilliseconds(), 3, '0');
            }    // Add time zone offset
            // Add time zone offset
            result += getTimeZone(date);
        }
        return result;
    }
    exports.default = toSQL;
});