/// <amd-module name="Types/_formatter/dateFromSql" />
define('Types/_formatter/dateFromSql', [
    'require',
    'exports',
    'Env/Env'
], function (require, exports, Env_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * @public
     * @author Мальцев А.А.
     */
                                                                      /**
     * Формат даты, используемый в SQL
     */
    /**
     * @public
     * @author Мальцев А.А.
     */
    /**
     * Формат даты, используемый в SQL
     */
    var SQL_FORMAT = /([0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{1,9})?)([+-])([0-9]{2})[:-]*([0-9]{2})*$/;    /**
     * Создает дату из строки даты в формате SQL. Если строка содержит информацию о времени, то оно будет приведено к
     * местному.
     * @function
     * @name Types/_formatter/dateFromSql
     * @param {String} dateTime Дата и/или время в формате SQL
     * @param {Number} [defaultTimeZone] Использовать указанная временную зону (смещение относительно часового пояса UTC в
     * минутах), если в строке временная зона не задана.
     * @return {Date}
     */
    /**
     * Создает дату из строки даты в формате SQL. Если строка содержит информацию о времени, то оно будет приведено к
     * местному.
     * @function
     * @name Types/_formatter/dateFromSql
     * @param {String} dateTime Дата и/или время в формате SQL
     * @param {Number} [defaultTimeZone] Использовать указанная временную зону (смещение относительно часового пояса UTC в
     * минутах), если в строке временная зона не задана.
     * @return {Date}
     */
    function fromSQL(dateTime, defaultTimeZone) {
        var dateSep = dateTime.indexOf('-');
        var timeSep = dateTime.indexOf(':');
        var millisecSep = dateTime.indexOf('.');
        var tz = dateTime.match(SQL_FORMAT);
        var tzSep = tz && tz.index + tz[1].length || -1;
        var retval = new Date();
        var ms = null;
        var msStr;
        var y;
        var m;
        var d;
        retval.setHours(0, 0, 0, 0);
        if (timeSep === -1 && dateSep === -1) {
            return retval;
        }    // It's only time with negative time zone
        // It's only time with negative time zone
        if (timeSep > -1 && dateSep > timeSep) {
            dateSep = -1;
        }    // Looking for milliseconds
        // Looking for milliseconds
        if (millisecSep !== -1) {
            msStr = dateTime.substr(millisecSep + 1, (tzSep === -1 ? dateTime.length : tzSep) - (millisecSep + 1));
            if (msStr.length > 3) {
                msStr = msStr.substr(0, 3);
            }
            ms = parseInt(msStr, 10);
            if (msStr.length < 3) {
                ms *= msStr.length === 2 ? 10 : 100;
            }
        }    // Apply date if defined
        // Apply date if defined
        if (dateSep !== -1) {
            y = parseInt(dateTime.substr(dateSep - 4, 4), 10);
            m = parseInt(dateTime.substr(dateSep + 1, 2), 10) - 1;
            d = parseInt(dateTime.substr(dateSep + 4, 2), 10);
            if (Env_1.constants.compatibility.dateBug && m === 0 && d === 1) {
                retval.setHours(1);
            }
            retval.setFullYear(y, m, d);
        }    // Apply time if defined
        // Apply time if defined
        if (timeSep !== -1) {
            retval.setHours(parseInt(dateTime.substr(timeSep - 2, 2), 10), parseInt(dateTime.substr(timeSep + 1, 2), 10), parseInt(dateTime.substr(timeSep + 4, 2), 10), ms);    // First use default time zone
            // First use default time zone
            var timeOffset = defaultTimeZone;    // Use time zone from dateTime if available
            // Use time zone from dateTime if available
            if (tz) {
                timeOffset = Number(tz[2] + '1') * (Number(tz[3]) * 60 + (Number(tz[4]) * 1 || 0));
            }    // Apply time zone by shifting minutes
            // Apply time zone by shifting minutes
            if (timeOffset !== undefined) {
                retval.setMinutes(retval.getMinutes() - timeOffset - retval.getTimezoneOffset());
            }
        }
        return retval;
    }
    exports.default = fromSQL;
});