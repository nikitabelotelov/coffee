/// <amd-module name="Types/_formatter/_numberWords/ru" />
define('Types/_formatter/_numberWords/ru', [
    'require',
    'exports',
    'Types/_formatter/_numberWords/utils'
], function (require, exports, utils_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var DIGITS = {
        '0': 'ноль',
        '1': 'один',
        '2': 'два',
        '3': 'три',
        '4': 'четыре',
        '5': 'пять',
        '6': 'шесть',
        '7': 'семь',
        '8': 'восемь',
        '9': 'девять'
    };
    var DIGITS_FEMININE = {
        '0': 'ноль',
        '1': 'одна',
        '2': 'две',
        '3': 'три',
        '4': 'четыре',
        '5': 'пять',
        '6': 'шесть',
        '7': 'семь',
        '8': 'восемь',
        '9': 'девять'
    };
    var TENS = {
        '0': 'десять',
        '1': 'одиннадцать',
        '2': 'двенадцать',
        '3': 'тринадцать',
        '4': 'четырнадцать',
        '5': 'пятнадцать',
        '6': 'шестнадцать',
        '7': 'семнадцать',
        '8': 'восемнадцать',
        '9': 'девятнадцать'
    };
    var TWENTIES = {
        '2': 'двадцать',
        '3': 'тридцать',
        '4': 'сорок',
        '5': 'пятьдесят',
        '6': 'шестьдесят',
        '7': 'семьдесят',
        '8': 'восемьдесят',
        '9': 'девяносто'
    };
    var HUNDREDS = {
        '0': '',
        '1': 'сто',
        '2': 'двести',
        '3': 'триста',
        '4': 'четыреста',
        '5': 'пятьсот',
        '6': 'шестьсот',
        '7': 'семьсот',
        '8': 'восемьсот',
        '9': 'девятьсот'
    };
    var THOUSANDS = [
        '',
        'тысяча',
        'миллион',
        'миллиард',
        'триллион',
        'квадриллион',
        'квинтиллион',
        'сикстиллион',
        'септиллион',
        'октиллион',
        'нониллион',
        'дециллион'
    ];
    var negword = 'минус';
    function numToWordsRu(num, feminine) {
        if (feminine === void 0) {
            feminine = false;
        }
        if (num[0] === '-') {
            return negword + ' ' + numToWordsRu(num.slice(1));
        }
        var words = [];    //let chunks = list(splitbyx(str(n), 3))
        //let chunks = list(splitbyx(str(n), 3))
        utils_1.iterateNumber(num, function (three, counter) {
            var i = three.length;
            if (three[0] !== '0') {
                words.push(HUNDREDS[three[0]]);
            }
            if (three[1] > 1) {
                words.push(TWENTIES[three[1]]);
            }
            if (three[1] == 1) {
                words.push(TENS[three[2]]);
            } else if (three[2] > 0 || +three === 0 && words.length === 0) {
                var dict = counter === 1 || feminine ? DIGITS_FEMININE : DIGITS;
                words.push(dict[three[2]]);
            }
            if (counter > 0 && +three != 0) {
                //@ts-ignore
                words.push(rk(THOUSANDS[counter], +three));
            }
        });
        return words.join(' ');
    }
    exports.default = numToWordsRu;
});