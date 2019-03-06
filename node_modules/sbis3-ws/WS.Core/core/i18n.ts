/// <amd-module name="Core/i18n" />
//@ts-ignore
import { constants, IoC, cookie } from 'Env/Env';
// @ts-ignore
import Deferred = require('Core/Deferred');
import 'Core/polyfill';

const PLURAL_PREFIX = 'plural#';
const PLURAL_DELIMITER = '|';
const EXPIRES_COOKIES = 2920;

const availableLanguage = {
   "ru-RU": "Русский (Россия)",
   "en-US": "English (USA)"
};

const global = (function(): ExtWindow {
   return this || (0, eval)('this');// eslint-disable-line no-eval
})();

let localizationEnabled = constants.isServerScript ?
   false :
   (constants.isNodePlatform ?
      true :
      (global.contents ?
         !!global.contents.defaultLanguage :
         constants.i18n
      )
   );

function RkString(value, resolver) {
   Object.defineProperties(this, {
      translatedValue: {
         enumerable: true,
         get() {
            return String(resolver(value) || value);
         }
      },
      length: {
         enumerable: true,
         get() {
            return this.translatedValue.length;
         }
      }
   });
}

RkString.prototype = Object.create(String.prototype);

RkString.prototype.toString = RkString.prototype.toJSON = RkString.prototype.valueOf = function getTranslatedValue() {
   return this.translatedValue;
};

/**
 * Функция грузит модуль с мета-информацией интерфейсного модуля.
 * @param nameModule - имя интерфейсного модуля.
 * @returns {Promise}
 */
function loadMetaInfo(nameModule) {
   const def = new Deferred();

   require([nameModule + "/.builder/module"], info => {
      def.callback(info);
   }, err => {
      def.errback(err);
   });

   return def;
}


/**
 * Самый простой мерж, мы знаем, что всегда мержим объекты
 * @param {Object} to
 * @param {Object} from
 */
function merge(to, from) {
   for (const i in from) {
      if (from.hasOwnProperty(i) && !to[i]) {
         to[i] = from[i];
      }
   }

   return to;
}

/**
 * Функция возращает URL c без указанного параметра.
 * Пример: 'path/?param1=value1&param2=value2'
 * @param request {Object} Тело запроса.
 * @param deleteParam {String} Имя парметра которое надо исключить.
 * @returns {string}
 */
function getUrlWithoutParam(request, deleteParam) {
   const query = request.query;

   if (Object.keys(query).length === 0 || Object.keys(query).length === 1 && query.hasOwnProperty(deleteParam)) {
      return request.originalUrl;
   }

   var result = '?';

   for (var name in query) {
      if (name !== deleteParam) {
         result += name + '=' + query[name] + '&';
      }
   }

   return request.originalUrl.split('?')[0] + result.slice(0, result.length - 1);
}

/**
 * Уставливает язык.
 * Устанавливаем rk
 */
function init() {
   if (localizationEnabled) {
      // Теперь определим текущий язык
      i18n.setLang(i18n.detectLanguage());
   } else {
      i18n.setLang('');
   }

   // Чтобы функция rk всегда была
   // На ПП она своя
   if (!global.hasOwnProperty('rk')) {
      Object.defineProperty(global,'rk', {
         enumerable: true,
         value: i18n.rk.bind(i18n)
      });
   }
}

/**
 * i18n - поддержка интернационализации. Подробнее о механизме интернационализации читайте в разделе <a href="https://wi.sbis.ru/doc/platform/developmentapl/internalization/">Интернационализация и локализация</a>.
 * @class Core/i18n
 * @author Бегунов А.В.
 * @public
 * @singleton
 */
const i18n = /** @lends Core/i18n.prototype */{
   /**
    * Инициализация синглтона
    */
   init() {
      if (this.isInit()) {
         return;
      }

      this.__init = true;
      init();
   },

   /**
    * Возвращает признак инициализации.
    * @return {boolean}
    */
   isInit() {
      return !!this.__init;
   },

   /**
    * Возвращает признак: включена ли локализация для текущего приложения.
    * @return {Boolean}
    * @see setEnable
    */
   isEnabled() {
      return localizationEnabled;
   },

   /**
    * Включает механизм локализации для текущего приложения.
    * @param {Boolean} enable
    * @see isEnabled
    */
   setEnable(enable) {
      localizationEnabled = enable;
      init();
   },

   /**
    * Функция опрделения языка из настройки браузера.
    */
   detectLanguageBrowser() {
      let detectedLang = this.getDefaultLang();
      const req = process.domain && process.domain.req;
      const acceptLang = req && req.headers && req.headers['accept-language']
          && req.headers['accept-language'].split(',');

      if (acceptLang) {
         acceptLang.some(langHeader => {
            const lang = langHeader.split(';')[0];

            if (lang.includes('-') && this.hasLang(lang)) {
               detectedLang = lang;
               return true;
            } else if (!lang.includes('-')) {
               for (const locale in this.getAvailableLang()) {
                  if (locale.startsWith(lang)) {
                     detectedLang = locale;
                     return true;
                  }
               }
            }
         });
      }

      return detectedLang;
   },


   /**
    * Переключает язык на сервисе представлений.
    * @param lang
    */
   _setLangOnNode(lang) {
      const request = process.domain && process.domain.req;
      const respond = process.domain && process.domain.res;

      if (request && respond && !(respond.cookies && respond.cookies.hasOwnProperty('lang'))) {
         cookie.set('lang', lang, {
            expires: EXPIRES_COOKIES,
            path: '/'
         });

         respond.redirect(getUrlWithoutParam(request, 'lang'));
      }
   },

   /**
    * Возвращает кодовое обозначение локали того языка, на который локализована данная страница веб-приложения.
    * @deprecated Используйте метод {@link getLang}.
    */
   detectLanguage() {
      if (this.isEnabled()) {
         if (constants.isNodePlatform) {
            let detectedLang = this.getDefaultLang();
            const request = process.domain && process.domain.req;

            if (request) {
               const reqCookie = request.cookies && request.cookies.lang;
               const queryLang = request.query && request.query.lang;

               detectedLang = queryLang || reqCookie || this.detectLanguageBrowser();
               detectedLang = this.hasLang(detectedLang) ? detectedLang : this.getDefaultLang();

               if (queryLang || !reqCookie) {
                  this._setLangOnNode(detectedLang);
               }
            }

            return detectedLang;
         }

         if (constants.isBrowserPlatform) {
            const avLang = this.getAvailableLang();
            let detectedLng = cookie.get('lang') || '';

            if (!detectedLng) {
               detectedLng = constants.defaultLanguage || (global.contents && global.contents.defaultLanguage);
            }

            // Если уже ничто не помогло, Возьмем первый язык из доступных
            if (!detectedLng || detectedLng.length !== 5 || !avLang[detectedLng]) {
               detectedLng = Object.keys(avLang)[0] || '';
            }

            return detectedLng;
         }

      }

      return '';
   },

   /**
    * Возращает кодовое значение языка по умолчанию.
    * @returns {String} <a href="/doc/platform/developmentapl/internalization/locale/">Кодовое обозначение локали</a>.
    * @see detectLanguage
    */
   getDefaultLang() {
      return constants.defaultLanguage || 'ru-RU';
   },

   /**
    * Возвращает кодовое обозначение локали того языка, на который локализована данная страница веб-приложения.
    * @returns {String} <a href="/doc/platform/developmentapl/internalization/locale/">Кодовое обозначение локали</a>.
    * Например, "ru-RU" или "en-US".
    * @see detectLanguage
    * @see getAvailableLang
    * @see hasLang
    * @see setLang
    */
   getLang() {
      if (this.isEnabled()) {
         if (constants.isNodePlatform) {
            return this.detectLanguage();
         }
         if (constants.isBrowserPlatform) {
            return this._currentLang;
         }
      }

      return '';
   },

   /**
    * Возвращает список языков, на которые может быть локализовано веб-приложение.
    * @returns {Object} Ключ - <a href="/doc/platform/developmentapl/internalization/locale/">кодовое обозначение локали</a>, значение - текстовая расшифровка локали.
    * @example
    * <pre>
    * {
    *    ru-RU: "Русский (Россия)",
    *    en-US: "English (USA)"
    * }
    * </pre>
    * @see detectLanguage
    * @see getLang
    * @see hasLang
    * @see setLang
    */
   getAvailableLang() {
      return availableLanguage;
   },

   /**
    * Метод возращает информацию о словарях поддерживаемых интерфейсным модулем.
    * @param nameModule - имя интерфейсного модуля
    * @returns {Promise}
    * @see isProcessedModule
    */
   getDictModule(nameModule) {
      if (this.isProcessedModule(nameModule)) {
         return this._modulesDict[nameModule];
      }

      this._modulesDict[nameModule] = loadMetaInfo(nameModule).addCallback(info => {
         const infoDict = {};

         if (info.dict) {
            for (const nameDict of info.dict) {
               const langAndExtDict = nameDict.split('.');

               infoDict[langAndExtDict[0]] = infoDict[langAndExtDict[0]] || [];
               infoDict[langAndExtDict[0]].push(langAndExtDict[1] ? langAndExtDict[1]: 'json');
            }
         }

         return infoDict;
      });

      return this._modulesDict[nameModule];
   },

   /**
    * Функция проверяет, что интерфейсный модуль ещё не обрабатывается.
    * @param nameModule - имя интерфейсного модуля.
    * @returns {Boolean}
    */
   isProcessedModule(nameModule) {
      return  this._modulesDict.hasOwnProperty(nameModule);
   },

   /**
    * Возвращает признак: может ли веб-приложение локализовано на указанный язык.
    * @param {String} language <a href="/doc/platform/developmentapl/internalization/locale/">Кодовое обозначение локали</a>.
    * @returns {Boolean}
    * @see getAvailableLang
    * @see detectLanguage
    * @see getLang
    * @see setLang
    */
   hasLang(language) {
      return language in availableLanguage;
   },

   /**
    * Устанавливает язык, на который будут переводиться значения.
    * @param {String} language Двухбуквенное название языка.
    * @returns {boolean}
    */
   setLang(language) {
      if (constants.isServerScript || constants.isNodePlatform) {
         return false;
      }

      if (this.isEnabled()) {
         let changeLang = false,
            oldLang = this._currentLang,
            currentLang;

         if (language && typeof (language) === 'string' && /..-../.test(language) && language !== this._currentLang) {
            const parts = language.split('-');
            this._currentLang = `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
            changeLang = true;
         }

         if (changeLang) {
            cookie.set('lang', this._currentLang, {
               expires: EXPIRES_COOKIES,
               path: '/'
            });

            currentLang = this._currentLang;
            document.addEventListener('DOMContentLoaded', () => {
               if (document.body.classList.length && oldLang) {
                  document.body.classList.remove(oldLang);
               }
               document.body.classList.add(currentLang);
            });
         }

         return changeLang;
      }

      document.addEventListener('DOMContentLoaded', () => {
         if (document.body.classList.length && this._currentLang) {
            document.body.classList.remove(this._currentLang);
         }
      });


      return false;
   },

   _translate(key, ctx, num) {
      /**
       * Если отдали НЕ строку, или не того кто ей "прикитворяется"
       * то выходим и не переводим
       */
      if (key === null || key === undefined || !key.indexOf) {
         return key;
      }

      let retValue = key;
      let lang = '';
      const index = key.indexOf(this._separator);
      if (index > -1) {
         ctx = key.substr(0, index);
         key = key.substr(index + this._separator.length);
      }
      if (typeof ctx === 'number') {
         num = ctx;
         ctx = '';
      }

      retValue = key;
      if (!constants.isServerScript && this.isEnabled()) {
         lang = this.getLang();
         if (lang && this._dict[lang]) {
            if (num !== undefined) {
               const trans_key = this._getTransKey(PLURAL_PREFIX + key, ctx, lang);
               retValue = trans_key ? this._plural(trans_key, num) : key;
            } else {
               retValue = this._getTransKey(key, ctx, lang) || key;
            }
         }
      }

      return retValue;
   },

   /**
    * Возвращает переведенное значение ключа.
    * @param {String} key Ключ локализации.
    * @param {String|Number} [ctx] <a href="/doc/platform/developmentapl/internalization/context/">Контекст перевода</a>.
    * Когда аргумент принимает число, то это трактуется как значение, под которое нужно подобрать множественную форму перевода слова (см. <a href="/doc/platform/developmentapl/internalization/javascript-localization/#word-case-by-number">Склонение слова в зависимости от числа</a>).
    * @param {Number} [num] Число, под которое нужно подобрать множественную форму перевода слова (см. <a href="/doc/platform/developmentapl/internalization/javascript-localization/#word-case-by-number">Склонение слова в зависимости от числа</a>).
    * @returns {String}
    * @public
    */
   rk(key, ctx, num) {

      if (key instanceof RkString) {
         /*Если в rk в качестве key передали класс RkString, то нам надо вернуть его же,
          иначе у нас будет цепочка инстансов, что может вызывать зависание при построение страницы на сервере.*/
         return key;
      }

      if (typeof window !== 'undefined' || key === null || key === undefined || !key.indexOf) {
         return this._translate(key, ctx, num);
      }

      return new RkString(key, (() => this._translate(key, ctx, num)));
   },

   _getTransKey(key, ctx, lang) {
      const trans_key = this._dict[lang][ctx ? `${ctx}${this._separator}${key}` : `${key}`];
      if (trans_key !== undefined) {
         return trans_key;
      }

      // Проверим, что включен НЕ русский язык, мы на клиенте и где-то где в адресе есть дефис - так
      // определим что мы не на бою
      if (lang !== 'ru-RU' && typeof window !== 'undefined' &&
         window.location.host.indexOf('-') > -1) {
         // Если в ключе есть русские буквы, значит нужно поругаться,
         // иначе это может быть пробел или символ из шаблона
         if (/[А-Яа-яA-Za-z]+/.test(key)) {
            IoC.resolve('ILogger').error('Localization', `Для ключа ${key} отсутствует перевод в словаре.`);
         }
      }

      return undefined;
   },

   /**
    * Проверят наличие словаря по его имени.
    * @param {String} dictName Имя словаря.
    * @param {String} [lang=this.getLang()]
    * @returns {boolean}
    * @see setDict
    * @see getDictPath
    */
   hasDict(dictName, lang) {
      lang = lang || this.getLang();
      return this._dictNames[lang] ? dictName in this._dictNames[lang] : false;
   },

   /**
    * Вставляет новый словарь
    * @param {Object} dict.
    * @param {String} name.
    * @param {String} [lang=this.getLang()]
    * @see hasDict
    * @see getDictPath
    */
   setDict(dict, name, lang) {
      lang = lang || this.getLang();
      if (lang && !this.hasDict(name, lang)) {
         if (name) {
            this._dictNames[lang] = this._dictNames[lang] || {};
            this._dictNames[lang][name] = true;
         }

         this._dict[lang] = merge(this._dict[lang] || {}, dict);
      }
   },

   /**
    * Отдает путь до словаря по имени модуля.
    * @param {String} moduleName
    * @param {String} lang
    * @param {String} ext
    * @return {String}
    * @see hasDict
    * @see setDict
    */
   getPathToDict(moduleName, lang, ext) {
      return `${moduleName}/lang/${lang}/${lang}.${ext}`;
   },

   _plural(str, num) {
      if (str !== undefined) {
         num = Math.abs(num);
         let lang = this.getLang(),
            arg;
         arg = [num].concat(str.split(PLURAL_DELIMITER));
         switch (lang) {
            case 'en-US':
               return this._pluralEn.apply(this, arg);
            case 'ru-RU':
               return this._pluralRu.apply(this, arg);
            default:
               return str;
         }
      }
      return undefined;
   },
   _pluralRu(num, word1, word2, word3, word4) {
      // если есть дробная часть
      if (num % 1 > 0) {
         return word4;
      }

      // если две последние цифры 11 ... 19
      num = num % 100;
      if (num >= 11 && num <= 19) {
         return word3;
      }

      // все остальные случаи - по последней цифре
      num = num % 10;

      if (num == 1) {
         return word1;
      }

      if (num == 2 || num == 3 || num == 4) {
         return word2;
      }
      return word3;
   },

   /**
    * Для английской локали
    * @param num число
    * @param word1 слово для 1
    * @param word2 слово для нескольких
    * @returns {String}
    * @private
    */
   _pluralEn(num, word1, word2) {
      if (num > 1 || num === 0) {
         return word2;
      }
      return word1;
   },

   __init: false,

   _modulesDict: {},

   /** Разделитель между контекстом и ключом */
   _separator: '@@',

   /** Текущий язык */
   _currentLang: '',

   /** Все загруженные словари, где ключ - слово на языке оригинала */
   _dict: {},

   /** Все загруженные словари, где ключ - имя словаря */
   _dictNames: {},

   _rkString: RkString
};

// Сразу инициализируемся
i18n.init();

export = i18n;
