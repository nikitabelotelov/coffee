define('View/Builder/Tmpl/function', [
   'View/Builder/Tmpl/expressions/process',
   'View/Builder/Tmpl/expressions/event',
   'View/Builder/Tmpl/modules/utils/common',
   'View/Builder/Tmpl/modules/control',
   'View/Builder/Tmpl/modules/if',
   'View/Builder/Tmpl/modules/for',
   'View/Builder/Tmpl/modules/else',
   'View/Builder/Tmpl/modules/partial',
   'View/Builder/Tmpl/modules/template',
   'View/Builder/Tmpl/modules/utils/tag',
   'View/Builder/Tmpl/modules/data/utils/dataTypesCreator',
   'View/Builder/Tmpl/modules/data/utils/functionStringCreator',
   'View/Builder/Tmpl/handlers/log',
   'View/Builder/Tmpl/modules/utils/parse',
   'Core/helpers/Function/shallowClone',
   'text!View/Builder/Tmpl/modules/templates/objectFunctionTemplate.jstpl',
   'text!View/Builder/Tmpl/modules/templates/objectFunctionHeaderTemplate.jstpl'
], function processingModule(
   processExpressions,
   eventExpressions,
   utils,
   moduleC,
   ifM,
   forM,
   elseM,
   par,
   tmp,
   tagUtils,
   DTC,
   FSC,
   log,
   parseUtils,
   shallowClone,
   objectFunctionTemplate,
   objectFunctionHeaderTemplate) {
   'use strict';

   objectFunctionHeaderTemplate = objectFunctionHeaderTemplate.replace(/\r/g, '');
   objectFunctionTemplate = objectFunctionTemplate.replace(/\r/g, '');

   function createAttrObject(val) {
      return { type: 'text', value: val };
   }

   function escape(entity) {
      if (entity && entity.replace) {
         var tagsToReplace = {
            "'" : "\\'",
            '"' : '\\"',
            "\\" : "\\\\"
         };
         return entity.replace(/['"\\]/g, function escapeReplace(tag) {
            return tagsToReplace[tag] || tag;
         });
      }
      return entity;
   }

   var specialSymbolsReArray = [{
      toFind: /¥/g,
      toReplace: '\\u00A5'
   }, {
      toFind: /۩/g,
      toReplace: '\\u06E9'
   }, {
      toFind: /₪/g,
      toReplace: '\\u20AA'
   }];

   var processing = {
      name: 'string',
      /**
       * Модули шаблонизатора
       */
      _modules: {
         'if': ifM,
         'for': forM,
         'else': elseM,
         'partial': par,
         'template': tmp
      },
      /**
       * Модули, использумые в управляющих атрибутах
       */
      _attributeModules: {
         'if': ifM,
         'for': forM
      },
      /**
       * Данные контролов
       */
      _controlsData: {},
      handlers: {},
      includeStack: {},
      includedFunctions: {},
      /**
       * Если не чистить данные контролов, на препроцессоре они будут копиться и для всех пользователей будут приходить лишние данные и контролы, которых нет на странице, будут пытаться зареквайриться
       */
      clearControlsData: function() {
         this._controlsData = {};
      },
      /**
       * Декорирование рутового узла
       */
      decorate: function decorate(attributes) {
         return function decorateRoot(rootAttribs) {
            if (!rootAttribs) {
               rootAttribs = {};
            }
            var attrs = shallowClone(rootAttribs);
            if (attributes) {
               for (var name in attributes) {
                  if (attrs[name]) {
                     if (attrs[name].data.length > 0) {
                        attrs[name].data.push(createAttrObject(' ' + attributes[name]));
                     } else if (attrs[name].data && !attrs[name].data.length) {
                        attrs[name].data = [attrs[name].data, createAttrObject(' ' + attributes[name])];
                     } else {
                        attrs[name] = {};
                        attrs[name].data = createAttrObject(attributes[name]);
                     }
                  } else {
                     attrs[name] = {};
                     attrs[name].data = createAttrObject(attributes[name]);
                  }
               }
            }
            return attrs;
         }
      },
      /**
       * Получение результирущего объекта
       * @param  {Array} ast  AST array of entities
       * @param  {Object} data Data
       * @return {Object}      Generated html-string
       */
      getString: function getFunction(ast, data, handlers, attributes, internal) {
         var decor = this.decorate(attributes),
            res = '',
            controlsData = this._controlsData;
         /**
          * Нам нужно пометить эту функцию, что она генерирует атрибуты для КОРНЕВОГО тега
          * тогда если корневой тег - partial, то есть, эта функция участвует при построении
          * функции внутреннего шаблона, то мы должны замержить еще и те атрибуты, которые
          * были переданы в сгенерированную функцию с родительского шаблона.
          * То есть контрол
          * MyButton имеет внутри себя корнем ws:partial
          * он же в свою очередь создает div
          * Тогда нужно чтобы при создании <MyButton attr:class="привет" />
          * атрибут class долетел до дива
          */
         decor.isMainAttrs = true;
         if (handlers) {
            /**
             * Конфиги переданные в requirejs плагине для шаблонизатора
             * @type {Array|*}
             */
            this.handlers = handlers;
            this.calculators = handlers.config.calculators;
            this.iterators = handlers.config.iterators;
            this.filename = handlers.filename;
            this.config = handlers.config;
         }
         var str = '' + this._process(ast, null, decor);

         if (str) {
            str = '' + str.replace(/\n/g, ' ');
         }

         if (!internal) {
            res += objectFunctionHeaderTemplate;
         }

         res += objectFunctionTemplate.replace('/*#TEMPLATE_STRING#*/', str)
            .replace('/*#FILENAME#*/', handlers.filename);

         return res;
      },
      getFunction: function getFunction(ast, data, handlers, attributes, internal) {
         var func = function () {};
         var str = 'no function';
         try {
            str = this.getString(ast, data, handlers, attributes, internal);
            func = new Function('data, attr, context, isVdom, sets', str);
            func.includedFunctions = this.includedFunctions;
            func.privateFn = this.privateFn;
            func.includedFn = this.includedFn;
         } catch (e) {
            log.IoC.resolve("ILogger").error(log.generateErrorMessage(handlers.filename), e, e);
            log.IoC.resolve("ILogger").log('generating function: ', str);
         }

         return func;
      },
      /**
       * Генерация подуключаемого модуля
       * @param tag
       * @param data
       * @returns {Array}
       */
      _processOptionModule: function processOptionModule(tag, data, decor) {
         return tagUtils.loadModuleFunction.call(this, moduleC.module, tag, data, decor);
      },
      /**
       * Для поиска модульных функций
       * @param  {Object} tag  Tag
       * @param  {Object} data Data object
       * @return {Object}      Entity: tag or text
       */
      _processModule: function processModule(tag, data, decor) {
         var moduleFunction = tagUtils.moduleMatcher.call(this, tag);
         return tagUtils.loadModuleFunction.call(this, moduleFunction, tag, data, decor);
      },
      /**
       * Для загрузки модулей)
       * @param name
       * @returns {Function}
       */
      _processTag: function processTag(name) {
         var modName = tagUtils.splitWs(name);
         if (this._modules[modName] && modName !== 'partial') {
            return this._processModule;
         } else {
            return this._checkForManageableAttributes;
         }
      },
      _processEntity: function (tag, data, decor, parentNS) {
         if (this._modules[tagUtils.splitWs(tag.name)]) {
            return this._processModule(tag, data, decor);
         }
         if (tagUtils.isTagRequirable.call(this, tag.name, DTC.injectedDataTypes)) {
            return this._processOptionModule(tag, data, decor);
         }
         return this._handlingTag(tag, data, decor, parentNS);
      },
      /**
       * Поиск методов шаблонизатора
       * @param  {Object} entity Tag, text, module
       * @return {Function}        Process function
       */
      _whatMethodShouldYouUse: function whatMethodShouldYouUse(entity) {
         return tagUtils.findFunctionCase.call(this, entity, '_process');
      },
      /**
       * Линеаризация AST
       * @param  {Object} entity Tag, text
       * @return {String}
       */
      _stopArrs: function stopArrs(entity) {
         var string = '', i;
         if (utils.isArray(entity)) {
            for (i = 0; i < entity.length; i++) {
               string += entity[i];
            }
            return string;
         }
         return entity;
      },
      /**
       * Поиск модулей в AST
       * @param  {Object} entity Tag, text, module
       * @param  {Object} data   Data object
       * @return {String}        Generated string
       */
      _seek: function _seek(entity, data, prev, next, decor, parentNS) {
         var method = this._whatMethodShouldYouUse(entity);
         if (method) {
            entity.prev = prev;
            entity.next = next;
            return this._stopArrs(method.call(this, entity, data, decor, parentNS));
         }
      },
      /**
       * Генерация текст, с переменными
       * @param  {Array} textData Array of data
       * @param  {Object} data     Data
       * @return {String}
       */
      _processData: function processData(textData, data, bindingObject, wrapUndef, needEscape, isAttribute, attrib) {
         var string = '', i, expressionResult, result = '';
         if (textData.length) {
            for (i = 0; i < textData.length; i++) {
               if (bindingObject) {
                  expressionResult = processExpressions(
                     textData[i],
                     data,
                     this.calculators,
                     this.filename,
                     bindingObject.isControl,
                     bindingObject.rootConfig,
                     bindingObject.propertyName,
                     isAttribute
                  );
               } else {
                  expressionResult = processExpressions(textData[i], data, this.calculators, this.filename, undefined, undefined, attrib, isAttribute);
               }
               // todo если считаем значение по умолчанию для биндинга, и пришел скажем 0 или null, все равно вернется пустая строка.
               if (utils.notUndefOrNull(expressionResult)) {
                  if (textData[i].type === 'var') {
                     if (textData[i].localized === true) {
                        string += '\' + (' + expressionResult + ') + \'';
                     } else {
                        if (wrapUndef) {
                           expressionResult = 'thelpers.wrapUndef(' + expressionResult + ')';
                        }
                        string += '\' + (' + expressionResult + ') + \'';
                     }
                  } else {
                     string += escape(expressionResult);
                  }
               } else {
                  string += '';
               }
            }
            result = string;
         }
         else if (needEscape!==false && textData.type === 'text') {
            result = escape(textData.value);
         }
         else if (bindingObject) {
            result = processExpressions(textData, data, this.calculators, this.filename, bindingObject.isControl, bindingObject.rootConfig, bindingObject.propertyName, isAttribute);
         }
         else {
            result = processExpressions(textData, data, this.calculators, this.filename, undefined, undefined, undefined, isAttribute);
         }

         if (typeof result === 'string') {
            // converting of special symbols. it needs for template building without errors in regexp what uses this symbols.
            specialSymbolsReArray.forEach(function (re) {
               result = result.replace(re.toFind, re.toReplace);
            });
         }
         return result;
      },
      _processAttributesObj: function processAttributesObj(attribs, data, tag) {
         var obj = {
               attributes: {},
               events: {},
               key: FSC.wrapAroundExec('key+"'+tag.key+'"')
            },
            processed,
            attrib;
         if (attribs) {
            for (attrib in attribs) {
               if (attribs.hasOwnProperty(attrib) && attribs[attrib]) {
                  if (eventExpressions.isEvent(attrib)) {
                     obj.events[attrib.toLowerCase()] = eventExpressions.processEventAttribute.call(this, attribs[attrib], attrib, data);
                  } else {
                     var isAttribute = true;

                     // todo хак для атрибута data-bind, там не надо эскейпить значение атрибута, потому что могут быть
                     // кавычки который должны остаться кавычками, это выражение позже будет использоваться для привязки данных
                     if (attrib === 'data-bind') {
                        isAttribute = false;
                     }

                     processed = this._processData(attribs[attrib].data, data, undefined, true, false, isAttribute, attrib);
                     if (utils.removeAllSpaces(processed) !== "") {
                        obj.attributes[attrib] = processed;
                     }
                  }
               }
            }
         }
         obj.events = FSC.wrapAroundExec('typeof window === "undefined"?{}:'+FSC.getStr(obj.events));

         return obj;
      },
      /**
       * Генерация строки текста
       * @param  {Object} text Text
       * @param  {Object} data Data
       * @return {String}
       */
      _processText: function processText(text, data) {
         var res = this._processData(text.data, data, undefined, true);
         res = res || '';
         return 'markupGenerator.createText(\'' + res + '\', key + \'' + text.key + '\'), \n';
      },
      _processDirective: function processDirective(directive, data) {
         return 'markupGenerator.createDirective(\'' + directive.data + '\'), \n';
      },
      _processComment: function processComment(directive, data) {
         var res = this._processData(directive.data, data, undefined, true);
         return 'markupGenerator.createComment(\'' + res + '\'), \n';
      },
      /**
       * Генерация строки тэга
       * @param tag
       * @param data
       * @returns {string}
       */
      _generateTag: function generateTag(tag, data, decor, parentNS) {
         if(tag.attribs && tag.attribs.xmlns) {
            parentNS = tag.attribs.xmlns;
         } else if(!tag.attribs) {
            tag.attribs = {
               xmlns: parentNS
            }
         } else {
            tag.attribs.xmlns = parentNS;
         }
         var attribs = decor && utils.isFunction(decor) ? decor(tag.attribs) : tag.attribs;
         var processed = this._processAttributesObj(attribs, data, tag);
         var processedStr = FSC.getStr(processed).replace(/\\("|')/g, '$1').replace(/\\\\/g, "\\").replace(/\' \+ /g, '" + ').replace(/ \+ \'/g, ' + "');
         var children = this._process(tag.children, data, undefined, parentNS);
         var attrToDecorate = decor ? 'attr' : 'attr?{context: attr.context, key: key+"'+tag.key+'"}:{}';
         return "markupGenerator.createTag('" + tag.name + "', " + processedStr + ", [" + children + "], " +
            attrToDecorate + ", defCollection, viewController), \n";
      },
      /**
       * Разбор управляющих атрибутов
       * @param attribs
       * @returns {Array}
       */
      _processManageableAttributes: function processManageableAttributes(attribs) {
         var constructArray = [], attrib;
         for (attrib in attribs) {
            if (this._attributeModules.hasOwnProperty(attrib) && attribs[attrib]) {
               if (attrib === 'if') {
                  constructArray.unshift({ module: attrib, value: attribs[attrib] });
               } else {
                  constructArray.push({ module: attrib, value: utils.clone(attribs[attrib]) });
               }
            }
         }
         return constructArray;
      },
      /**
       * Генерация тэга, если присутствует управляющий атрибут <div if="{{true}}">...
       * @param tag
       * @param data
       * @returns {*}
       */
      _useManageableAttributes: function useManageableAttributes(tag, data, decor, parentNS) {
         var constructArray = this._processManageableAttributes(tag.attribs);
         if (!!constructArray.length) {
            var moduleName = constructArray.shift().module;
            // если элемент - label, нужно рассматривать его атрибут for как уникальный идентификатор http://htmlbook.ru/html/label/for , а не как цикл в tmpl
            if (moduleName === 'for' && tag.name === 'label') {
               return this._processEntity(tag, data, decor, parentNS);
            }
            return tagUtils.loadModuleFunction.call(
               this,
               parseUtils.attributeParserMatcherByName.call(this, moduleName),
               tag,
               data,
               decor
            );
         }
         return this._processEntity(tag, data, decor, parentNS);
      },
      /**
       * Проверяем, есть ли атрибуты, для ускорения генерации
       * @param tag
       * @param data
       * @returns {*}
       */
      _checkForManageableAttributes: function checkForManageableAttributes(tag, data, decor, parentNS) {
         if (tag.attribs) {
            return this._useManageableAttributes(tag, data, decor, parentNS);
         }
         return this._processEntity(tag, data, decor, parentNS);
      },
      /**
       * Генерация тега
       * @param  {Object} tag  Tag
       * @param  {Object} data Array
       * @return {String}
       */
      _handlingTag: function handlingTag(tag, data, decor, parentNS) {
         return this._generateTag(tag, data, decor, parentNS);
      },
      /**
       * Рекурсивная функция для генерации вёрстки
       * @param  {Array} ast  AST array
       * @param  {Object} data Data
       * @return {String}
       */
      _process: function process(ast, data, decor, parentNS) {
         var string = '', st;
         for (var i = 0; i < ast.length; i++) {
            st = this._seek(ast[i], data, ast[i-1], ast[i+1], decor, parentNS);
            if (st) {
               string += st;
            }
         }
         return string;
      }
   };
   return processing;
});