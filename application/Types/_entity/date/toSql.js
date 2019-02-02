///<amd-module name="Types/_entity/date/toSql" />
/**
 * Serializes Date to the preferred SQL format.
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
    var FORMAT = {
        'time': 'HH:mm:ss',
        'date': 'YYYY-MM-DD',
        'datetime': 'YYYY-MM-DD HH:mm:ss'
    };
    var UNIX_EPOCH_START = new Date(0);    /**
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
        var hours = Math.floor(totalMinutes / 60);
        var minutes = totalMinutes - 60 * hours;
        if (hours < 10) {
            hours = '0' + hours;
        }
        if (minutes === 0) {
            minutes = '';
        } else if (minutes < 10) {
            minutes = '0' + minutes;
        }
        return '' + (isEast ? '+' : '-') + hours + (minutes ? ':' + minutes : '');
    }
    function toSQL(date, mode) {
        if (mode === void 0) {
            mode = MODE.DATETIME;
        }
        var result = formatter_1.date(date, FORMAT[mode]);
        if (mode !== MODE.DATE && date > UNIX_EPOCH_START) {
            //Add milliseconds
            if (date.getMilliseconds() > 0) {
                result += '.' + date.getMilliseconds();
            }    //Add time zone offset
            //Add time zone offset
            result += getTimeZone(date);
        }
        return result;
    }
    exports.default = toSQL;
});