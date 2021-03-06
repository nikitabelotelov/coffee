define('View/decorators', [
      'Env/Env',
      'Core/markup/ParserUtilities',
      'Core/helpers/i18n/wordCaseByNumber',
      'Core/Sanitize',
      'Core/helpers/String/escapeHtml',
      'Core/helpers/String/linkWrap',
      'Core/helpers/String/escapeTagsFromStr',

      'View/Executor/GeneratorCompatible'
      // добавлено здесь в зависимость, чтобы Серверный скрипт (Абрамов Виктор)
      // не умеет синхронно подгрузить модуль по месту требования. добавлено здесь, чтобы модуль был подгружен только в случае constants.compat = true
   ],
   function decoratorsLoader(Env, Parser, wordCaseByNumber, Sanitize, escapeHtml, linkWrap, escapeTagsFromStr) {
   'use strict';

   /**
    * Decorators used by pipe notation in template expressions. For example: value|trim|toUpperCase
    *
    */
   function createBindingObject(controlPropName, contextFieldName, way, direction) {
             var
            DIR_FROM_CONTEXT = 'fromContext',
            structureSeparator = '/',
            propArr = controlPropName.split(structureSeparator),
            propName = propArr[0],
            propPath = propArr.slice(1),
            propPathStr = propPath.join(structureSeparator);
            return {
               fieldName: contextFieldName,
               propName: controlPropName,
               propPath: propPath,
               fullPropName: controlPropName,
               propPathStr: propPathStr,
               oneWay: way,
               direction: direction || DIR_FROM_CONTEXT,
               nonExistentValue: undefined,
               bindNonExistent: false
            };
   }

   function sum(str) {
      var res = '';
      var digit;
      for(var i = str.length - 1; i >= -1; i--) {
         if(i === -1) {
            res = '1' + res;
            break;
         }
         var parseIntFn = Number.parseInt || window.parseInt;
         digit = parseIntFn(str[i]);
         digit = digit + 1;
         if(digit > 9) {
            res = '0' + res;
         } else {
            res = str.slice(0, i) + digit + res;
            break;
         }
      }
      return res;
   }

   function moneyDecorateStr(str) {
      str = '' + str;
      var parseFloatFn = Number.parseFloat || window.parseFloat; // В IE parseFloat лежит не в Number, а в window
      var parseIntFn = Number.parseInt || window.parseInt;
      var num = parseFloatFn('' + str);
      if(isFinite(num)) {
         var fractPart = str.match(/\.[0-9]*/);
         fractPart = '0' + fractPart;
         var fractParsed = parseFloatFn(fractPart);
         var fractPartFixed;
         var roundFract = false;
         if(isFinite(fractParsed)) {
            fractParsed = fractParsed.toFixed(2);
            if(fractParsed > 0.99) {
               roundFract = true;
            }
            fractPartFixed = fractParsed.substring(2);
         } else {
            fractPartFixed = '00';
         }
         var intPart = str.split('.')[0];
         if(!isFinite(parseIntFn(intPart))) {
            intPart = '0';
         }
         if(roundFract) {
            intPart = sum(intPart);
         }
         return intPart + '.' + fractPartFixed;
      } else {
         return '0.00';
      }
   }

   function not(value) {
      return value !== undefined && value !== null;
   }
   function toFixed(x) {
      if (Math.abs(x) < 1.0) {
         var e = parseInt(x.toString().split('e-')[1]);
         if (e) {
            x *= Math.pow(10,e-1);
            x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
         }
      } else {
         var e = parseInt(x.toString().split('+')[1]);
         if (e > 20) {
            e -= 20;
            x /= Math.pow(10,e);
            x += (new Array(e+1)).join('0');
         }
      }
      return x;
   }
   function isExpNumber(text) {
      if (typeof text === 'string' && text.indexOf('e') !== -1 && !Number.isNaN(parseFloat(text))) {
         return true;
      }
      if (typeof text === 'number' && Math.abs(text) >= 1e21) {
         return true;
      }
      return false;
   }
   function getPartsOfNumber(text, alwaysFraction) {
      if (isExpNumber(text)) {
         text = toFixed(parseFloat(text));
      } else {
         text = text + '';
      }

      var
         integer,
         fraction =  text.split('.')[1] || (alwaysFraction ? '00' : ''),
         numReg = /^-?([0]*)(\d+)\.?\d*\D*$/,
         regResult;
         if (!text.match(numReg)) {
            integer = '0';
         }
      regResult = text.replace(numReg, '$2');
      integer = integer === '0' ? integer: (text.substr(0, 1) === '-' ? '-' : '') + (regResult.replace(/(?=(\d{3})+$)/g, ' ').trim());
      if (fraction.length == 1 && alwaysFraction) {
         fraction = fraction + '0';
      }
      return {
         integer: integer,
         fraction: fraction
      };
   }
   function makeSafeForRegex(unescapedPattern) {
      return unescapedPattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
   }
   function highlightFragment(node, fragmentRegex, cssClass) {
      var res = false;
      if (node.childNodes) {
         for (var i = 0; i < node.childNodes.length; i++) {
            res = highlightFragment(node.childNodes[i], fragmentRegex, cssClass ) || res;
         }
      }
      if (node.text && fragmentRegex.test(node.text)) {
         node.text = node.text.replace(
            fragmentRegex,
            '<span class="' + cssClass + '">$&</span>'
         );
         return true;
      } else {
         return res;
      }
   }
   function specToObject(spec) {
      var
         BOLD = 0x8000000,
         ITALIC = 0x4000000,
         UNDERLINE = 0x2000000,
         STRIKE = 0x1000000;

      function specToNumber(spec) {
         if(!spec) {
            return 0;
         } else if(typeof spec === 'string') {
            spec = Number(spec);
            if(isNaN(spec)) {
               spec = 0;
            }
         } else if(typeof spec === 'object') {
            var rSpec = Number((spec.color || '0').replace('#', '0x'));
            rSpec |= spec.isBold ? BOLD : 0;
            rSpec |= spec.isItalic ? ITALIC : 0;
            rSpec |= spec.isUnderline ? UNDERLINE : 0;
            rSpec |= spec.isStrike ? STRIKE : 0;

            return rSpec;
         }
         return spec;
      }

      function lPad3b(s) {
         var pad = '000000';
         return pad.substr(0, 6 - s.length) + s;
      }

      spec = specToNumber(spec);
      return {
         color: '#' + lPad3b((spec & 0xFFFFFF).toString(16)).toLowerCase(),
         isBold: !!(spec & BOLD),
         isItalic: !!(spec & ITALIC),
         isUnderline: !!(spec & UNDERLINE),
         isStrike: !!(spec & STRIKE)
      };
   }
   var decorators = {
      isArray: function isArray(entity) {
         return (Object.prototype.toString.call(entity) === '[object Array]');
      },
      isString: function isString(entity) {
         return (Object.prototype.toString.call(entity) === '[object String]');
      },
      isObject: function isObject(entity) {
         return (Object.prototype.toString.call(entity) === '[object Object]');
      },
      orEmpty: function orEmpty(entity) {
         if (entity === undefined || entity === null) {
            return '';
         }
         return entity;
      },
      ucFirst: function ucFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
      },
      toUpperCase: function toUpperCase(string) {
         return string.toUpperCase();
      },
      toLowerCase: function toLowerCase(string) {
         return string.toLowerCase();
      },
      trace: function trace(expression, name, writeup) {
         var lt;
         if (writeup) {
            lt = 'RUNNING TRACE DECORATOR: ' + writeup + ', Result of expression: ';
            Env.IoC.resolve('ILogger', 'ConsoleLogger').info(lt, expression);
         } else {
            lt = 'RUNNING TRACE DECORATOR: ' +  'Your Expression: ' + name + ', Result of expression ';
            Env.IoC.resolve('ILogger', 'ConsoleLogger').info(lt, expression);
         }
         return expression;
      },
      trim: function trim(string) {
         return string.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
      },
      substr: function substr(string, start, length) {
         return string.substr(start, length);
      },
      replace: function replace(string, pattern, newPattern) {
         pattern = makeSafeForRegex(pattern);
         return string.replace(new RegExp(pattern, 'g'), newPattern);
      },
      wordCaseByNumber: wordCaseByNumber,
      wrapURLs: function wrapURLs() {
         return linkWrap.wrapURLs.apply(undefined, arguments);
      },
      unescape: function unescape(s) {
         var translate_re = /&(nbsp|amp|quot|apos|lt|gt);/g,
            translate = {"nbsp": " ","amp" : "&","quot": "\"","apos": "'","lt"  : "<","gt"  : ">"};

         s = s.replace(/&lcub;&lcub;/g, '{{').replace(/&rcub;&rcub;/g, '}}');
         return ( s.replace(translate_re, function(match, entity) {
            return translate[entity];
         }) );
      },
      strftime: function strftime() {
         var args = Array.prototype.slice.call(arguments);
         return Date.prototype.strftime.apply(args.shift(), args);
      },
      bind: function bindDataDecorator(value, controlPropName, initValue, direction) {
         if (not(initValue)) {
            return { value: initValue, binding: createBindingObject(controlPropName, value, true, direction) };
         }
         return { binding: createBindingObject(controlPropName, value, true, direction) };
      },
      mutable: function bindDataDecorator(value, controlPropName, initValue) {
         if (not(initValue)) {
            return { value: initValue, binding: createBindingObject(controlPropName, value, false) };
         }
         return { binding: createBindingObject(controlPropName, value, false) };
      },
      // сохраняем тут опции переданные декоратору санитайза, чтобы потом после всех декораторов позвать функцию санитайза с этими опциями
      _sanitizeOpts: (function () {
         var opts = {};
         return function(val) {
            if (val) {
               opts = val;
            } else {
               var res = opts;
               opts = {};
               return res;
            }
         };
      })(),
      sanitize: function sanitizeDecorator(value, opts) {
         decorators._sanitizeOpts(opts);
         return value;
      },
      escapeTagsFromStr: function escapeTagsFromStrDec() {
         return escapeTagsFromStr.apply(this, Array.prototype.slice.call(arguments));
      },
      /**
       * Преобразует значение в вёрстку в формате 'деньги'
       * @param {string|number} text Вещественное число.
       * @param {string} type Тип с которым необходимо отобразить деньги, доступно 7 типов
       * <ul>
       *    <li>AccentResults - Акцентная сумма в строке Итоги;</li>
       *    <li>NoAccentResults - Не акцентная сумма в строке Итоги;</li>
       *    <li>Group - Сумма в группировке;</li>
       *    <li>BasicRegistry - Основная сумма в реестре;</li>
       *    <li>NoBasicRegistry - Не основная сумма в реестре;</li>
       *    <li>AccentRegistry - Акцентная сумма в реестре;</li>
       *    <li>NoAccentRegistry - Не акцентная сумма в реестре;</li>
       * </ul>
       * @returns {HTML} text Верстку числа в денежном виде.
       */
      money: function(text, type) {
         var
            fixedNumStr = moneyDecorateStr(text),
            result,
            numberObj = getPartsOfNumber(fixedNumStr, true),
            title;

         title = ' title="' + numberObj.integer + '.' + numberObj.fraction + '"';
         result = '<span class="ws-moneyDecorator"' + title + '><span class="ws-moneyDecorator__integer__' + type + '">' + numberObj.integer;
         result = result + '</span><span class="ws-moneyDecorator__fraction">.' + numberObj.fraction + '</span></span>';
         return result;
      },
      /**
       * Отображает значение в виде отформатированного вещественного числа, с разделением разрядов целой части пробелами
       * @param {string|number} text Вещественное число.
       * @param {Number} fractionSize Количество знаков после запятой. Если их нет, то допишет нули. Если 0, то отображается только целая часть
       * @returns {String} text Отформатированное вещественное число.
       */
      number: function(text, fractionSize) {
         var
            numberObj = getPartsOfNumber(text);
         if (fractionSize !== undefined) {
            numberObj.fraction = (numberObj.fraction + '00000000000000000000').substr(0, fractionSize);
         }
         return numberObj.fraction ? numberObj.integer + '.' + numberObj.fraction :  numberObj.integer;
      },
      /**
       * Вставляет в текст разметку, отображающую фразу подсвеченной
       * @param {string} text Текст
       * @param {string} highlight Фраза для подсветки
       * @param {string} cssClass CSS класс, обеспечивающий подсветку
       * @returns {string} Верстка, в которой фраза highlight подсвечена
       */
      highlight: function(text, highlight, cssClass) {
         if (!text || !highlight) {
            return text;
         }
         if (cssClass === undefined) {
            cssClass = 'controls-HtmlDecorators-highlight';
         }

         // нам нужно искать фразу для подсветки в уже санитизированной строке, т.к. в ней некоторые
         // теги могут стать текстом, а подсветку мы делаем именно в тексте
         text = Sanitize(text);
         text = Parser.parse(text);

         // Проверяем строку на наличие кавычек для "точного совпадения". Они нужны
         // для поиска, но при подсветке мы их игнорируем, потому что их не будет в
         // подсвечиваемом тексте
         if (highlight[0] === '"' && highlight[highlight.length - 1] === '"') {
            highlight = highlight.slice(1, highlight.length - 1);
         }

         highlight = makeSafeForRegex(escapeHtml('' + highlight));

         // escapeHtml экранирует теги и кавычки. Кавычки не являются специальным
         // символом для highlight и могут встречаться в поисковой строке, поэтому
         // восстанавливаем их в исходный вид
         highlight = highlight.replace(/&quot;/g, '"');

         var res = highlightFragment(text, new RegExp(highlight, 'gi'), cssClass),
            foundWords, word;

         // если фраза в тексте найдена не была, попробуем поискать отдельные слова фразы в тексте, и подсветим одно первое найденное
         // подсвечиваем одно найденное слово, потому что в стандарте поиск фразы работает именно так. если вся фраза найдена не была,
         // поиск осуществляется по каждому слову фразы и выводится пачка результатов в которых хотя бы одно слово совпадает со словом из фразы
         if (!res) {
            foundWords = highlight.split(' '); // слова - то, что разделено пробелами
            foundWords = foundWords.filter(function(str){return str.trim() !== ''}); // убираем пустые строки
            if (foundWords) {
               for (var i = 0; i < foundWords.length; i++) {
                  word = foundWords[i];
                  res = highlightFragment(text, new RegExp(word, 'i'), cssClass);
                  if (res) {
                     break;
                  }
               }
            }
         }
         return text.innerHTML();
      },
      /**
       * Формирует css-стиль на основе переданной спецификации
       * @param {string|number|object} value Спецификация стиля
       * @returns {string} Верстка, в которой фраза highlight подсвечена
       */
      colorMark: function(value) {
         var specObject, rules;

         if (!value) {
            return value;
         }

         specObject = specToObject(value);

         rules = 'color: ' + specObject.color + ';' +
                 (specObject.isBold ? 'font-weight: bold;' : '') +
                 (specObject.isItalic ? 'font-style: italic;' : '');

         if (specObject.isUnderline || specObject.isStrike) {
            rules += 'text-decoration:' +
                     (specObject.isUnderline ? ' underline' : '') +
                     (specObject.isStrike ? ' line-through' : '') + ';';
         }

         return rules;
      }
   };
   return decorators;
});
