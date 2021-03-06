/// <amd-module name="View/Executor/TClosure" />

// @ts-ignore
import * as Serializer from 'Core/Serializer';
// @ts-ignore
import * as i18n from 'Core/i18n';
// @ts-ignore
import { IoC, constants as cConstants } from 'Env/Env';
// @ts-ignore
import * as config from 'View/config';

import { GeneratorText, GeneratorVdom } from './Markup';
import { Focus, Scope, Attr } from './Expressions';
import { Common, ConfigResolver } from './Utils';

var decorators;
function getDecorators() {
   if (decorators) {
      return decorators;
   } else {
      // @ts-ignore
      decorators = require('View/decorators');
      return decorators;
   }
}

function addToString() {
   IoC.resolve("ILogger").error(
      "Использование контентной опции компонента или шаблона в качестве строки",
      "Необходимо использовать контентные опции с помощью конструкции ws:partial или " +
      "обратитесь в отдел Инфраструктура представления.");
   return this.join("");
}

var
   getter = function getter(obj, path) {
      if (obj && typeof obj === 'object') {
         obj.__lastGetterPath = path;
      }
      for (var i = 0; i < path.length; i++) {
         var name = path[i];

         if (obj != undefined) {
            if (obj.has && obj.get && obj.has(name)) {
               // Чтобы можно было звать дефолтные свойства модели
               obj = obj.get(name);
            } else {

               /**
                * if we want get "_options" field
                * we maybe want all fields from current scope
                * It is actual for stateless wml files
                */
               if (name !== '_options' || obj[name]) {
                  obj = obj[name];
               }
            }
         } else {
            return undefined;
         }
      }

      return obj;
   },

   /**
    * Set name property on object to value.
    *
    * @param obj
    * @param path
    * @param value
    */
   setter = function setter(obj, path, value) {
      var
         lastPathPart = path.pop(),
         lastObj = getter(obj, path);

      if (lastObj) {
         if (lastObj.set) {
            lastObj.set(lastPathPart, value);
         } else {
            lastObj[lastPathPart] = value;
         }
         return true;
      }
      return false;
   },
   restrictedPropertiesInScope = ['_parent'],
   isAllowedProperty = function isAllowedProperty(propertyName) {
      return restrictedPropertiesInScope.indexOf(propertyName) === -1;
   },
   presetScope = function presetScope(object, data, key, firstArgument) {
      if (firstArgument.key) {
         data[firstArgument.key] = key;
      }
      data[firstArgument.value] = object;
      return data;
   },
   createScope = function createScope(scope) {
      /**
       * Функция используется только в цикле for
       * тот объект, который возвращается здесь
       * будет пропатчен внутри итератора, как объект.
       * Как модель его патчить нельзя (то есть, вызывать set),
       * а значит сделаем из модели обычный объект
       */
      return Object.create(scope && scope._getRawData ? scope._getRawData() : (scope || null));
   },
   isFunction = function isFunction(fn) {
      return Object.prototype.toString.call(fn) === '[object Function]';
   },
   isObject = function isObject(fn) {
      return Object.prototype.toString.call(fn) === '[object Object]';
   },
   wrapUndef = function wrapUndef(value) {
      if (value === undefined || value === null) {
         return "";
      } else {
         if (checkPinTypes(value)) {
            return pinTypes[value._moduleName](value);
         }
         return value;
      }
   },
   /**
    * Замыкает опции для partial. Нужен для того
    * чтобы отличить мердж опций компонента от простого шаблона
    * @param inner
    * @param outer
    * @returns {reshaper}
    */
   uniteScope = function uniteScope(inner, outer) {
      var reshaper = function reshaper(mergeFn) {
         /**
          * inner здесь - это "внешний" scope
          * при создадии 2х контролов последовательно с одинм scope,
          * опции переопределнные для первого не должны попадать в опции второго контрола
          */

         var obj;
         if (typeof inner === 'object') {
            /**
             * Создаем новый объект от текущего, чтобы не портить
             * текущий для следующих использований и сохранить весь scope
             */
            obj = Object.create(inner || {});
            /**
             * А теперь перенесем данные из inner в obj, чтобы не отвалились компоненты,
             * которые проверяют наличие scope первого уровня по hasOwnProperty
             * НЕ ТОЛЬКО!. ЭТА ШТУКА НУЖНА, ИНАЧЕ ПРИ СОЗДАНИИ КОНТРОЛА/partial со SCOPE={{obj}} - объект
             * поелтит в проперти контролноды по ссылке и мы не сможем чекнуть изменения
             */
            for (var i in inner) {
               if (inner.hasOwnProperty(i)) {
                  obj[i] = inner[i];
               }
            }
            if (!obj["__$$__originObject"]) {
               /*Делаем так чтобы объект не сериализовался при возврате с БЛ
               * при сериализации по нему делают for in*/
               Object.defineProperty(obj, '__$$__originObject', {
                  value: inner,
                  enumerable: false,
                  configurable: false
               });
            }

         } else {
            /**
             * Сюда могут передать строку
             * тогда ее отдаем как и раньше
             */
            obj = inner;
         }
         return mergeFn(obj, outer);
      };
      (reshaper as any).__$unite = true;
      return reshaper;
   },
   getTypeFunction = function (name, arg) {
      var res = Serializer.getFuncFromDeclaration(name ? name.trim() : name);
      if (typeof res === 'function' && Object.keys(arg).length) {
         res = res.bind(undefined, arg);
      }
      if (typeof res !== 'function') {
         IoC.resolve("ILogger").error('Function "' + name + '" has not been loaded yet! Add this function to the module definition');
      }
      return res;
   },
   enumTypePin = function typeEnum(value) {
      return String(value);
   },
   // Коллекция типов для которых нужен особый вывод
   pinTypes = {
      'Types/collection:Enum': enumTypePin,
      'Data/collection:Enum': enumTypePin,
      'Data/_collection/Enum': enumTypePin,
      'WS.Data/Type/Enum': enumTypePin
   },

   /**
    * Calls function to set value for binding.
    *
    * @param event
    * @param value
    * @param fn
    */
   bindProxy = function (event, value, fn) {
      fn.call(this, value);
   },

   checkPinTypes = function checkPinTypes(value) {
      return value && value._moduleName && pinTypes.hasOwnProperty(value._moduleName);
   },
   isolateScope = function (scope, data, propertyName) {
      if (!scope['___$patched$' + propertyName]) {
         var parentValueProperty = scope[propertyName];
         if (parentValueProperty !== undefined) {
            if (isObject(data)) {
               data = Object.create(data);
            }
            data[propertyName] = parentValueProperty;
         } else {
            scope['___$wasundef$' + propertyName] = true;
         }
         scope[propertyName] = data;
         scope['___$patched$' + propertyName] = true;
      } else {
         if (!scope['___$wasundef$' + propertyName]) {
            if (isObject(data)) {
               data = Object.create(data);
            }
            data[propertyName] = scope[propertyName][propertyName];
         }
         scope[propertyName] = data;
      }
      scope[Scope.propertyNameToIdentifyIsolatedScope] = propertyName;
      return scope;
   },
   isForwardableOption = function (optionName) {
      return optionName !== 'name';
   },
   filterOptions = function (scope) {
      var filteredScope = {};

      if (!isObject(scope)) {
         return scope;
      }

      // Only keep options that are forwardable. Do not forward ones that
      // identify a specific instance, for example `name`
      for (var key in scope) {
         if (scope.hasOwnProperty(key) && isForwardableOption(key)) {
            filteredScope[key] = scope[key];
         }
      }

      return filteredScope;
   },
   templateError = function error(filename, e, data) {
      if (data.__lastGetterPath && e.message.indexOf('apply') > -1) {
         IoC.resolve("ILogger").error('Template ' + filename + ' failed to generate html.',
            new Error("Field " + data.__lastGetterPath.toString().replace(/,/g, '.') + ' is not a function!'));
      }
      IoC.resolve("ILogger").error('Template ' + filename + ' failed to generate html.', e, e);
   },
   partialError = function partialError() {
      try {
         if (typeof window !== 'undefined') {
            //Сообщение только на клиенте, потому что на ПП нет хорошего стека
            //и это никак не отладить
            throw new Error('Использование функции в качестве строковой переменной! Необходимо обернуть в тег ws:partial. ');
         }
      } catch (err) {
         //Платформенные компоненты не готовы к такому повороту
         //IoC.resolve("ILogger").error('Error!', err.message, err);
      }
   },
   getMarkupGenerator = function (isVdom) {
      var generator;

      // TODO удалить когда слой совместимости будет не нужен
      if (!isVdom) {
         if (cConstants.isNodePlatform) {
            // @ts-ignore
            if (!process.domain) {
               // @ts-ignore
               generator = require('View/Executor/GeneratorCompatible');
               // @ts-ignore
            } else if (process.domain.req && process.domain.req.compatible !== false) {
               // @ts-ignore
               generator = require('View/Executor/GeneratorCompatible');
            }
         } else if (cConstants.isServerScript) {
            // @ts-ignore
            generator = require('View/Executor/GeneratorCompatible');
         }
      }

      generator = generator || (isVdom ? GeneratorVdom : GeneratorText);

      return generator;
   },
   makeFunctionSerializable = function makeFunctionSerializable(func, scope) {

      var funcStr = '';
      if (typeof window === 'undefined') {
         funcStr = func.toString();
      }
      func = func.bind(scope);
      func.toStringOrigin = func.toString;
      func.toString = function () {

         if (typeof window === 'undefined' && funcStr.indexOf('createControl') > -1) {
            partialError();
         }
         return func(this);
      }.bind(scope);

      if (typeof window === 'undefined') {
         func.toJSON = function () {
            return "TEMPLATEFUNCTOJSON=" + funcStr;
         };
      }
      return func;
   },
   // Пока не избавимся от всех использований concat для массивных опций
   // нужно вещать toString на них
   createDataArray = function createDataArray(array, templateName) {
      Object.defineProperty(array, 'isDataArray', {
         value: true,
         configurable: true,
         enumerable: false,
         writable: true
      });
      Object.defineProperty(array, 'toString', {
         value: function addToString() {
            IoC.resolve("ILogger").error(
               "Использование контентной опции компонента или шаблона в качестве строки",
               "Необходимо использовать контентные опции с помощью конструкции ws:partial или " +
               "обратитесь в отдел Инфраструктура представления. Шаблон: " + templateName);
            return this.join("");
         },
         configurable: true,
         enumerable: false,
         writable: true
      });

      return array;
   },
   // Существует пока есть второй прогон dot на препроцессоре
   sanitizeContent = function sanitizeContent(content) {
      // @ts-ignore
      var Sanitize = require('Core/Sanitize');
      var opts = getDecorators()._sanitizeOpts();

      // экранируем скобки только если код выполняется в сервисе представления, только там может dot дважды эскейпиться
      // @ts-ignore
      if (typeof process !== 'undefined' && !process.versions) {
         content = Common.escapeParenthesis(content);
      }

      return Sanitize(content, opts);
   };

export = {
   createDataArray: createDataArray,
   isolateScope: isolateScope,
   filterOptions: filterOptions,
   configResolver: ConfigResolver,
   calcParent: ConfigResolver.calcParent,
   wrapUndef: wrapUndef,
   getDecorators: getDecorators,
   Sanitize: sanitizeContent,
   iterators: config.iterators,
   templateError: templateError,
   partialError: partialError,
   makeFunctionSerializable: makeFunctionSerializable,
   isFunction: isFunction,
   createScope: createScope,
   presetScope: presetScope,
   getter: getter,
   setter: setter,
   rk: i18n.rk.bind(i18n),
   IoC: IoC,
   config: config,
   utils: Common,
   uniteScope: uniteScope,
   plainMerge: Common.plainMerge,
   plainMergeAttr: Common.plainMergeAttr,
   plainMergeContext: Common.plainMergeContext,
   calculateScope: Scope.calculateScope,
   getTypeFunc: getTypeFunction,
   getMarkupGenerator: getMarkupGenerator,
   bindProxy: bindProxy,
   isObject: isObject,
   prepareAttrsForFocus: Focus.prepareAttrsForFocus,
   attrExpressions: Attr,
   _isTClosure: true
};
