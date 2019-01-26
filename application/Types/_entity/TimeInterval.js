///<amd-module name="Types/_entity/TimeInterval" />
/**
 * Реализация объекта "Временной интервал".
 *
 * "Временной интервал" предназначен для хранения относительного временного промежутка, т.е. начало и окончание которого
 * не привязано к конкретным точкам во времени. Он может быть использован для хранения времени выполнения какого-либо
 * действия или для хранения времени до наступления события. При установке значения переменной данного типа, сохраняется
 * только дельта. При этом нужно учитывать, что интервал нормализует значения. В результате, интервал в 1 день, 777 часов,
 * 30 минут будет преобразован в интервал равный 33-м дням, 9 часам, 30 минутам, и будет сохранён именно в таком формате.
 * Формат ISO 8601 урезан до дней. Причина в том, что в случае использования месяцев и лет возникает неоднозначность. В итоге,
 * строковой формат выглядит так:
 * P[<Число_недель>W][<Число_дней>D][T[<Число_часов>H][<Число_минут>M][<Число_секунд>[.Число_долей_секунды]S]
 *
 * @class Types/_entity/TimeInterval
 * @public
 * @author Бегунов А.В.
 */
define('Types/_entity/TimeInterval', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var millisecondsInSecond = 1000;
    var millisecondsInMinute = 60000;
    var millisecondsInHour = 3600000;
    var millisecondsInDay = 86400000;
    var secondsInMinute = 60;
    var minutesInHour = 60;
    var hoursInDay = 24;
    var intervalKeys = [
        'days',
        'hours',
        'minutes',
        'seconds',
        'milliseconds'
    ];
    var millisecondsConst = {
        days: millisecondsInDay,
        hours: millisecondsInHour,
        minutes: millisecondsInMinute,
        seconds: millisecondsInSecond,
        milliseconds: 1
    };
    var regExesForParsing = {
        regExp: /^P(?:(-?[0-9]+)D)?(?:T(?:(-?[0-9]+)H)?(?:(-?[0-9]+)M)?(?:(-?[0-9]+(?:\.[0-9]{0,3})?)[0-9]*S)?)?$/i,
        format: 'P[<Число_дней>D][T[<Число_часов>H][<Число_минут>M][<Число_секунд>[.Число_долей_секунды]S]'
    };
    var regExesForValidation = {
        regExp: /^P(-?[0-9]+D)?(T(-?[0-9]+H)?(-?[0-9]+M)?(-?[0-9]+(\.[0-9]+)?S)?)?$/i,
        format: 'P[<Число_дней>D][T[<Число_часов>H][<Число_минут>M][<Число_секунд>[.Число_долей_секунды]S]'
    };
    ;
    function toNumber(number) {
        return parseFloat(number) || 0;
    }
    function truncate(number) {
        return number > 0 ? Math.floor(number) : Math.ceil(number);
    }
    function fromIntervalStrToIntervalArray(intervalStr) {
        var intervalArray = [];
        var regexResult = regExesForParsing.regExp.exec(intervalStr);
        if (!isValidStrInterval(intervalStr)) {
            throw new Error(rk('Передаваемый аргумент не соответствует формату ISO 8601. Допустимые форматы') + ': ' + regExesForValidation.format + '. ');
        }    // i = 1 - исключаем первый элемент из перебора, так как это всего лишь строка intervalStr
        // i = 1 - исключаем первый элемент из перебора, так как это всего лишь строка intervalStr
        regexResult.slice(1).forEach(function (value, i) {
            if (i === regexResult.length - 1) {
                // секунды
                intervalArray.push(truncate(Number(value)));    // миллисекунды
                // миллисекунды
                intervalArray.push((Number(value) % 1 * 1000).toFixed());
            } else {
                intervalArray.push(toNumber(value));
            }
        });
        return intervalArray;
    }
    function fromIntervalArrayToIntervalObj(intervalArray) {
        var intervalObj = {};
        for (var i = 0; i < intervalKeys.length; i++) {
            intervalObj[intervalKeys[i]] = toNumber(String(intervalArray[i]));
        }
        return intervalObj;
    }
    function fromIntervalObjToMilliseconds(intervalObj) {
        var milliseconds = 0;
        for (var key in millisecondsConst) {
            if (millisecondsConst.hasOwnProperty(key)) {
                var val = millisecondsConst[key];
                milliseconds += val * toNumber(intervalObj[key]);
            }
        }
        return milliseconds;
    }
    function fromMillisecondsToNormIntervalObj(milliseconds) {
        var normIntervalObj = {};
        for (var key in millisecondsConst) {
            if (millisecondsConst.hasOwnProperty(key)) {
                var val = millisecondsConst[key];
                normIntervalObj[key] = truncate(milliseconds / val);
                milliseconds = milliseconds % val;
            }
        }
        return normIntervalObj;
    }    // преобразует нормализованный объект в нормализованную строку: {days: 1, hours: 2, minutes: 3, seconds: 4, milliseconds: 5} => "P1DT2H3M4.005S"
    // преобразует нормализованный объект в нормализованную строку: {days: 1, hours: 2, minutes: 3, seconds: 4, milliseconds: 5} => "P1DT2H3M4.005S"
    function fromNormIntervalObjToNormIntervalStr(normIntervalObj) {
        var secondsWithMilliseconds = Number((normIntervalObj.seconds + normIntervalObj.milliseconds / 1000).toFixed(3));
        return 'P' + normIntervalObj.days + 'D' + 'T' + normIntervalObj.hours + 'H' + normIntervalObj.minutes + 'M' + secondsWithMilliseconds + 'S';
    }
    function isValidStrInterval(intervalStr) {
        return regExesForValidation.regExp.test(intervalStr);
    }    // вызывать с помощью call или apply
         /**
     * @class
     * @name Types/_entity/TimeInterval
     * @public
     */
    // вызывать с помощью call или apply
    /**
     * @class
     * @name Types/_entity/TimeInterval
     * @public
     */
    var TimeInterval = /** @class */
    function () {
        /**
         * Конструктор.
         *
         * @param {Types/_entity/TimeInterval | String | Array | Object | Number} source - Может быть: строка - “P20DT3H1M5S”, массив - [5, 2, 3, -4], объект - {days: 1, minutes: 5}, число – 6 или объект типа Types/_entity/TimeInterval. Если передается массив, то первый элемент – дни, второй – часы, т.д. до миллисекунд. Остальные элементы игнорируются. Если передается число, то оно интерпретируется, как количество миллисекунд.
         * @return {Types/_entity/TimeInterval}
         */
        function TimeInterval(source) {
            if (this instanceof TimeInterval) {
                this._normIntervalObj = undefined;
                this._normIntervalStr = undefined;
                this.set(source);
            } else {
                throw new Error(rk('TimeInterval вызывать через оператор new'));
            }
        }    /**
         * Возвращает колличество дней в интервале.
         * @return {Number}
         * @function
         * @name Types/_entity/TimeInterval#getDays
         */
        /**
         * Возвращает колличество дней в интервале.
         * @return {Number}
         * @function
         * @name Types/_entity/TimeInterval#getDays
         */
        TimeInterval.prototype.getDays = function () {
            return this._normIntervalObj.days;
        };    /**
         * Добавляет дни к интервалу.
         *
         * @param {Number} days - Колличество дней.
         * @return {Types/_entity/TimeInterval}
         * @function
         * @name Types/_entity/TimeInterval#addDays
         */
        /**
         * Добавляет дни к интервалу.
         *
         * @param {Number} days - Колличество дней.
         * @return {Types/_entity/TimeInterval}
         * @function
         * @name Types/_entity/TimeInterval#addDays
         */
        TimeInterval.prototype.addDays = function (days) {
            return this.addMilliseconds(days * millisecondsInDay);
        };
        ;    /**
         * Вычитает дни из интервала.
         *
         * @param {Number} days - Колличество дней.
         * @return {Types/_entity/TimeInterval}
         * @function
         * @name Types/_entity/TimeInterval#subDays
         */
        /**
         * Вычитает дни из интервала.
         *
         * @param {Number} days - Колличество дней.
         * @return {Types/_entity/TimeInterval}
         * @function
         * @name Types/_entity/TimeInterval#subDays
         */
        TimeInterval.prototype.subDays = function (days) {
            return this.subMilliseconds(days * millisecondsInDay);
        };
        ;    /**
         * Возвращает колличество часов в интервале.
         *
         * @return {Number}
         * @function
         * @name Types/_entity/TimeInterval#getHours
         */
        /**
         * Возвращает колличество часов в интервале.
         *
         * @return {Number}
         * @function
         * @name Types/_entity/TimeInterval#getHours
         */
        TimeInterval.prototype.getHours = function () {
            return this._normIntervalObj.hours;
        };
        ;    /**
         * Добавляет часы к интервалу.
         *
         * @param {Number} hours - Колличество часов.
         * @return {Types/_entity/TimeInterval}
         * @function
         * @name Types/_entity/TimeInterval#addHours
         */
        /**
         * Добавляет часы к интервалу.
         *
         * @param {Number} hours - Колличество часов.
         * @return {Types/_entity/TimeInterval}
         * @function
         * @name Types/_entity/TimeInterval#addHours
         */
        TimeInterval.prototype.addHours = function (hours) {
            return this.addMilliseconds(hours * millisecondsInHour);
        };
        ;    /**
         * Вычитает часы из интервала.
         *
         * @param {Number} hours - Колличество часов.
         * @return {Types/_entity/TimeInterval}
         * @function
         * @name Types/_entity/TimeInterval#subHours
         */
        /**
         * Вычитает часы из интервала.
         *
         * @param {Number} hours - Колличество часов.
         * @return {Types/_entity/TimeInterval}
         * @function
         * @name Types/_entity/TimeInterval#subHours
         */
        TimeInterval.prototype.subHours = function (hours) {
            return this.subMilliseconds(hours * millisecondsInHour);
        };
        ;    /**
         * Возвращает колличество минут в интервале.
         *
         * @return {Number}
         * @function
         * @name Types/_entity/TimeInterval#getMinutes
         */
        /**
         * Возвращает колличество минут в интервале.
         *
         * @return {Number}
         * @function
         * @name Types/_entity/TimeInterval#getMinutes
         */
        TimeInterval.prototype.getMinutes = function () {
            return this._normIntervalObj.minutes;
        };
        ;    /**
         * Добавляет минуты к интервалу.
         *
         * @param {Number} minutes - Колличество минут.
         * @return {Types/_entity/TimeInterval}
         * @function
         * @name Types/_entity/TimeInterval#addMinutes
         */
        /**
         * Добавляет минуты к интервалу.
         *
         * @param {Number} minutes - Колличество минут.
         * @return {Types/_entity/TimeInterval}
         * @function
         * @name Types/_entity/TimeInterval#addMinutes
         */
        TimeInterval.prototype.addMinutes = function (minutes) {
            return this.addMilliseconds(minutes * millisecondsInMinute);
        };
        ;    /**
         * Вычитает часы из интервала.
         *
         * @param {Number} hours - Колличество часов.
         * @return {Types/_entity/TimeInterval}
         * @function
         * @name Types/_entity/TimeInterval#subMinutes
         */
        /**
         * Вычитает часы из интервала.
         *
         * @param {Number} hours - Колличество часов.
         * @return {Types/_entity/TimeInterval}
         * @function
         * @name Types/_entity/TimeInterval#subMinutes
         */
        TimeInterval.prototype.subMinutes = function (minutes) {
            return this.subMilliseconds(minutes * millisecondsInMinute);
        };
        ;    /**
         * Возвращает колличество секунд в интервале.
         *
         * @return {Number}
         * @function
         * @name Types/_entity/TimeInterval#getSeconds
         */
        /**
         * Возвращает колличество секунд в интервале.
         *
         * @return {Number}
         * @function
         * @name Types/_entity/TimeInterval#getSeconds
         */
        TimeInterval.prototype.getSeconds = function () {
            return this._normIntervalObj.seconds;
        };
        ;    /**
         * Добавляет секунды к интервалу.
         *
         * @param {Number} seconds - Колличество секунд.
         * @return {Types/_entity/TimeInterval}
         * @function
         * @name Types/_entity/TimeInterval#addSeconds
         */
        /**
         * Добавляет секунды к интервалу.
         *
         * @param {Number} seconds - Колличество секунд.
         * @return {Types/_entity/TimeInterval}
         * @function
         * @name Types/_entity/TimeInterval#addSeconds
         */
        TimeInterval.prototype.addSeconds = function (seconds) {
            return this.addMilliseconds(seconds * millisecondsInSecond);
        };
        ;    /**
         * Вычитает секунды из интервала.
         *
         * @param seconds {Number} Колличество секунд.
         * @return {Types/_entity/TimeInterval}
         * @function
         * @name Types/_entity/TimeInterval#subSeconds
         */
        /**
         * Вычитает секунды из интервала.
         *
         * @param seconds {Number} Колличество секунд.
         * @return {Types/_entity/TimeInterval}
         * @function
         * @name Types/_entity/TimeInterval#subSeconds
         */
        TimeInterval.prototype.subSeconds = function (seconds) {
            return this.subMilliseconds(seconds * millisecondsInSecond);
        };
        ;    /**
         * Возвращает колличество миллисекунд в интервале.
         *
         * @return {Number}
         * @function
         * @name Types/_entity/TimeInterval#getMilliseconds
         */
        /**
         * Возвращает колличество миллисекунд в интервале.
         *
         * @return {Number}
         * @function
         * @name Types/_entity/TimeInterval#getMilliseconds
         */
        TimeInterval.prototype.getMilliseconds = function () {
            return this._normIntervalObj.milliseconds;
        };
        ;    /**
         * Добавляет миллисекунды к интервалу.
         *
         * @param {Number} milliseconds - Колличество миллисекунд.
         * @return {Types/_entity/TimeInterval}
         * @function
         * @name Types/_entity/TimeInterval#addMilliseconds
         */
        /**
         * Добавляет миллисекунды к интервалу.
         *
         * @param {Number} milliseconds - Колличество миллисекунд.
         * @return {Types/_entity/TimeInterval}
         * @function
         * @name Types/_entity/TimeInterval#addMilliseconds
         */
        TimeInterval.prototype.addMilliseconds = function (milliseconds) {
            return this.set(this.getTotalMilliseconds() + truncate(milliseconds));
        };
        ;    /**
         * Вычитает миллисекунды из интервала.
         *
         * @param {Number} milliseconds - Колличество миллисекунд.
         * @return {Types/_entity/TimeInterval}
         * @function
         * @name Types/_entity/TimeInterval#subMilliseconds
         */
        /**
         * Вычитает миллисекунды из интервала.
         *
         * @param {Number} milliseconds - Колличество миллисекунд.
         * @return {Types/_entity/TimeInterval}
         * @function
         * @name Types/_entity/TimeInterval#subMilliseconds
         */
        TimeInterval.prototype.subMilliseconds = function (milliseconds) {
            return this.set(this.getTotalMilliseconds() - truncate(milliseconds));
        };
        ;    /**
         * Возвращает общее колличество часов в интервале, переводя дни в часы.
         *
         * @return {Number}
         * @function
         * @name Types/_entity/TimeInterval#getTotalHours
         */
        /**
         * Возвращает общее колличество часов в интервале, переводя дни в часы.
         *
         * @return {Number}
         * @function
         * @name Types/_entity/TimeInterval#getTotalHours
         */
        TimeInterval.prototype.getTotalHours = function () {
            return this._normIntervalObj.days * hoursInDay + this._normIntervalObj.hours;
        };
        ;    /**
         * Возвращает общее колличество минут в интервале, переводя дни и часы в минуты.
         *
         * @return {Number}
         * @function
         * @name Types/_entity/TimeInterval#getTotalMinutes
         */
        /**
         * Возвращает общее колличество минут в интервале, переводя дни и часы в минуты.
         *
         * @return {Number}
         * @function
         * @name Types/_entity/TimeInterval#getTotalMinutes
         */
        TimeInterval.prototype.getTotalMinutes = function () {
            return this.getTotalHours() * minutesInHour + this._normIntervalObj.minutes;
        };
        ;    /**
         * Возвращает общее колличество секунд в интервале, переводя дни, часы и минуты в секунды.
         *
         * @return {Number}
         * @function
         * @name Types/_entity/TimeInterval#getTotalSeconds
         */
        /**
         * Возвращает общее колличество секунд в интервале, переводя дни, часы и минуты в секунды.
         *
         * @return {Number}
         * @function
         * @name Types/_entity/TimeInterval#getTotalSeconds
         */
        TimeInterval.prototype.getTotalSeconds = function () {
            return this.getTotalMinutes() * secondsInMinute + this._normIntervalObj.seconds;
        };
        ;    /**
         * Возвращает общее колличество миллисекунд в интервале, переводя дни, часы, минуты и секунды в миллисекунды.
         *
         * @return {Number}
         * @function
         * @name Types/_entity/TimeInterval#getTotalMilliseconds
         */
        /**
         * Возвращает общее колличество миллисекунд в интервале, переводя дни, часы, минуты и секунды в миллисекунды.
         *
         * @return {Number}
         * @function
         * @name Types/_entity/TimeInterval#getTotalMilliseconds
         */
        TimeInterval.prototype.getTotalMilliseconds = function () {
            return this.getTotalSeconds() * millisecondsInSecond + this._normIntervalObj.milliseconds;
        };
        ;    /**
         * Устанавливает значение интервала.
         *
         * @param {Types/_entity/TimeInterval | String | Array | Object | Number} source - Может быть: строка - “P20DT3H1M5S”, массив - [5, 2, 3, -4], объект - {days: 1, minutes: 5}, число – 6 или объект типа Types/_entity/TimeInterval. Если передается массив, то первый элемент – дни, второй – часы, т.д. до миллисекунд. Остальные элементы игнорируются. Если передается число, то оно интерпретируется, как количество миллисекунд.
         * @return {Types/_entity/TimeInterval} Возвращает this.
         * @function
         * @name Types/_entity/TimeInterval#set
         */
        /**
         * Устанавливает значение интервала.
         *
         * @param {Types/_entity/TimeInterval | String | Array | Object | Number} source - Может быть: строка - “P20DT3H1M5S”, массив - [5, 2, 3, -4], объект - {days: 1, minutes: 5}, число – 6 или объект типа Types/_entity/TimeInterval. Если передается массив, то первый элемент – дни, второй – часы, т.д. до миллисекунд. Остальные элементы игнорируются. Если передается число, то оно интерпретируется, как количество миллисекунд.
         * @return {Types/_entity/TimeInterval} Возвращает this.
         * @function
         * @name Types/_entity/TimeInterval#set
         */
        TimeInterval.prototype.set = function (source) {
            var type;    //source = coreClone(source);
            //source = coreClone(source);
            if (source instanceof TimeInterval) {
                type = 'timeInterval';
            } else if (typeof source === 'string') {
                type = 'intervalStr';
            } else if (source instanceof Array) {
                source = source.slice();
                type = 'intervalArray';
            } else if (source && typeof source === 'object') {
                source = Object.assign({}, source);
                type = 'intervalObj';
            } else {
                source = toNumber(source);
                type = 'milliseconds';
            }
            switch (type) {
            case 'intervalStr':
                source = fromIntervalStrToIntervalArray(source);    // pass through
            // pass through
            case 'intervalArray':
                source = fromIntervalArrayToIntervalObj(source);    // pass through
            // pass through
            case 'intervalObj':
                source = fromIntervalObjToMilliseconds(source);    // pass through
            // pass through
            case 'milliseconds':
                this._normIntervalObj = source = fromMillisecondsToNormIntervalObj(source);
                this._normIntervalStr = fromNormIntervalObjToNormIntervalStr(source);
                break;
            case 'timeInterval':
                this.assign(source);
                break;
            }
            return this;
        };
        ;    /**
         * Возвращает значение интервала в виде строки формата ISO 8601.
         *
         * @return {String} P[<Число_дней>D][T[<Число_часов>H][<Число_минут>M][<Число_секунд>[.Число_долей_секунды]S].
         *
         */
        /**
         * Возвращает значение интервала в виде строки формата ISO 8601.
         *
         * @return {String} P[<Число_дней>D][T[<Число_часов>H][<Число_минут>M][<Число_секунд>[.Число_долей_секунды]S].
         *
         */
        TimeInterval.prototype.toString = function () {
            return String(this._normIntervalStr);
        };
        ;
        TimeInterval.prototype.valueOf = function () {
            return String(this._normIntervalStr);
        };
        ;    /**
         * Возвращает значение интервала в виде объекта {days: 1, minutes: 2, seconds: 3, miliseconds: 4}.
         *
         * @return {Object}
         */
        /**
         * Возвращает значение интервала в виде объекта {days: 1, minutes: 2, seconds: 3, miliseconds: 4}.
         *
         * @return {Object}
         */
        TimeInterval.prototype.toObject = function () {
            return Object.assign({}, this._normIntervalObj);
        };
        ;    /**
         * Возвращает клон интервала.
         *
         * @return {Types/_entity/TimeInterval}
         */
        /**
         * Возвращает клон интервала.
         *
         * @return {Types/_entity/TimeInterval}
         */
        TimeInterval.prototype.clone = function () {
            return new TimeInterval(this);
        };
        ;    /**
         * Возвращает результат операции над интервалом.
         *
         * @param {String} operation - Возможные значения: '==', '!=', '>=', '<=', '>', '<', '+', '-', '+=', '-='.
         * @param {Types/_entity/TimeInterval} operand
         * @return {Types/_entity/TimeInterval | Boolean} ['+=', '-='] - this, ['+', '-'] - новый TimeInterval-объект, ['==', '!=', '>=', '<=', '>', '<'] - true/false.
         */
        /**
         * Возвращает результат операции над интервалом.
         *
         * @param {String} operation - Возможные значения: '==', '!=', '>=', '<=', '>', '<', '+', '-', '+=', '-='.
         * @param {Types/_entity/TimeInterval} operand
         * @return {Types/_entity/TimeInterval | Boolean} ['+=', '-='] - this, ['+', '-'] - новый TimeInterval-объект, ['==', '!=', '>=', '<=', '>', '<'] - true/false.
         */
        TimeInterval.prototype.calc = function (operation, operand) {
            var allowedOps = [
                '==',
                '!=',
                '>=',
                '<=',
                '>',
                '<',
                '+',
                '-',
                '+=',
                '-='
            ];
            if (allowedOps.indexOf(operation) === -1) {
                throw new Error(rk('Операция') + ' "' + operation + '" ' + rk('не доступна. Разрешенные операции') + ': ' + allowedOps.join(', '));
            }
            if (!(this instanceof TimeInterval && operand instanceof TimeInterval)) {
                throw new Error(rk('Operand должен быть объектом класса TimeInterval'));
            }
            var milliseconds1 = this.getTotalMilliseconds(), milliseconds2 = operand.getTotalMilliseconds();
            switch (operation) {
            case '==':
                return milliseconds1 === milliseconds2;
            case '!=':
                return milliseconds1 !== milliseconds2;
            case '>=':
                return milliseconds1 >= milliseconds2;
            case '<=':
                return milliseconds1 <= milliseconds2;
            case '>':
                return milliseconds1 > milliseconds2;
            case '<':
                return milliseconds1 < milliseconds2;
            case '+':
                return new TimeInterval().set(milliseconds1 + milliseconds2);
            case '-':
                return new TimeInterval().set(milliseconds1 - milliseconds2);
            case '+=':
                return this.set(milliseconds1 + milliseconds2);
            case '-=':
                return this.set(milliseconds1 - milliseconds2);
            }
        };
        ;    /**
         * Прибавляет интервал к дате.
         *
         * @param {Date} date
         * @return {Date}
         */
        /**
         * Прибавляет интервал к дате.
         *
         * @param {Date} date
         * @return {Date}
         */
        TimeInterval.prototype.addToDate = function (date) {
            return this._dateModifier(1, date);
        };
        ;    /**
         * Вычитает интервал из даты.
         *
         * @param {Date} date
         * @return {Date}
         */
        /**
         * Вычитает интервал из даты.
         *
         * @param {Date} date
         * @return {Date}
         */
        TimeInterval.prototype.subFromDate = function (date) {
            return this._dateModifier(-1, date);
        };
        ;    /**
         * Присваивает значение из временного интервала.
         * @param {TimeInterval} source
         */
        /**
         * Присваивает значение из временного интервала.
         * @param {TimeInterval} source
         */
        TimeInterval.prototype.assign = function (source) {
            this._normIntervalObj = source.toObject();
            this._normIntervalStr = source.valueOf();
        };
        TimeInterval.prototype._dateModifier = function (sign, date) {
            date = new Date(date.getTime());
            date.setTime(date.getTime() + sign * this.getTotalMilliseconds());
            return date;
        };    /**
         * Возвращает строку формата ISO 8601.
         *
         * @param {Types/_entity/TimeInterval | String | Array | Object | Number} source - Может быть: строка - “P20DT3H1M5S”, массив - [5, 2, 3, -4], объект - {days: 1, minutes: 5}, число – 6 или объект типа Types/_entity/TimeInterval. Если передается массив, то первый элемент – дни, второй – часы, т.д. до миллисекунд. Остальные элементы игнорируются. Если передается число, то оно интерпретируется, как количество миллисекунд.
         * @return {String} P[<Число_дней>D][T[<Число_часов>H][<Число_минут>M][<Число_секунд>[.Число_долей_секунды]S].
         */
        /**
         * Возвращает строку формата ISO 8601.
         *
         * @param {Types/_entity/TimeInterval | String | Array | Object | Number} source - Может быть: строка - “P20DT3H1M5S”, массив - [5, 2, 3, -4], объект - {days: 1, minutes: 5}, число – 6 или объект типа Types/_entity/TimeInterval. Если передается массив, то первый элемент – дни, второй – часы, т.д. до миллисекунд. Остальные элементы игнорируются. Если передается число, то оно интерпретируется, как количество миллисекунд.
         * @return {String} P[<Число_дней>D][T[<Число_часов>H][<Число_минут>M][<Число_секунд>[.Число_долей_секунды]S].
         */
        TimeInterval.toString = function (source) {
            if (source !== undefined) {
                return TimeInterval.prototype.set.call({}, source)._normIntervalStr;
            }
            return Function.toString.call(this);
        };
        ;
        return TimeInterval;
    }();
    exports.default = TimeInterval;
});