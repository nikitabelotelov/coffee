define('Types/_formatter/_numberWords/en', [
    'require',
    'exports',
    'Types/_formatter/_numberWords/utils'
], function (require, exports, utils_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var DIGITS = [
        'zero',
        'one',
        'two',
        'three',
        'four',
        'five',
        'six',
        'seven',
        'eight',
        'nine'
    ];
    var TENS = [
        'ten',
        'eleven',
        'twelve',
        'thirteen',
        'fourteen',
        'fifteen',
        'sixteen',
        'seventeen',
        'eighteen',
        'nineteen'
    ];
    var TWENTIES = {
        2: 'twenty',
        3: 'thirty',
        4: 'forty',
        5: 'fifty',
        6: 'sixty',
        7: 'seventy',
        8: 'eighty',
        9: 'ninety'
    };
    var THOUSANDS = {
        1: 'thousand',
        2: 'million',
        3: 'billion',
        4: 'trillion',
        5: 'quadrillion',
        6: 'quintillion',
        7: 'sextillion',
        8: 'septillion',
        9: 'octillion',
        10: 'nonillion',
        11: 'decillion'
    };
    var negword = 'minus';
    function concat(right, left) {
        if (left.value == 1 && right.value < 100) {
            return right;
        } else if (left.value < 100 && left.value > right.value) {
            return {
                title: left.title + '-' + right.title,
                value: left.value + right.value
            };
        } else if (left.value >= 100 && left.value > right.value) {
            return {
                title: left.title + ' and ' + right.title,
                value: left.value + right.value
            };
        }
        return {
            title: left.title + ' ' + right.title,
            value: left.value + right.value
        };
    }
    function numberWordsEN(num) {
        if (num[0] === '-') {
            return negword + ' ' + numberWordsEN(num.slice(1));
        }
        var words = [];    // let chunks = list(splitbyx(str(n), 3))
        // let chunks = list(splitbyx(str(n), 3))
        utils_1.iterateNumber(num, function (three, counter) {
            var prepareWord = [];
            if (three[0] !== '0') {
                prepareWord.push({
                    title: DIGITS[three[0]] + ' hundred',
                    value: three[0] * 100
                });
            }
            if (three[1] > 1) {
                prepareWord.push({
                    title: TWENTIES[three[1]],
                    value: three[1] * 10
                });
            }
            if (three[1] == 1) {
                prepareWord.push({
                    title: TENS[three[2]],
                    value: +three.slice(1)
                });
            } else if (three[2] > 0 || +three === 0 && words.length === 0) {
                prepareWord.push({
                    title: DIGITS[three[2]],
                    value: +three[2]
                });
            }
            if (prepareWord.length > 0) {
                var word = prepareWord.reduceRight(concat).title;
                if (counter > 0 && +three != 0) {
                    word += ' ' + rk(THOUSANDS[counter], +three);
                }
                words.push(word);
            }
        });
        return words.join(', ');
    }
    exports.default = numberWordsEN;
});