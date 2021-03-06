define('View/Builder/Tmpl/modules/utils/parse', [
   'View/Builder/Tmpl/modules/data/utils/functionStringCreator',
   'View/Builder/Tmpl/modules/utils/common',
   'View/Builder/Tmpl/expressions/process',
   'View/Builder/Tmpl/expressions/statement',
   'View/Builder/Tmpl/expressions/bind',
   'View/Builder/Tmpl/expressions/event',
   'View/Executor/Expressions',
   'Core/helpers/Object/isEmpty'
], function straightFromFileLoader(
   FSC,
   utils,
   processExpressions,
   processStatement,
   bindExpressions,
   eventExpressions,
   Expressions,
   isEmptyObject
) {
   'use strict';
   var checkRestrictedAttributes = function checkRestrictedAttributes(isRestricted, restrictedAttributes, curAttribute) {
      if (isRestricted && isRestricted.partial) {
         restrictedAttributes.push('template');
      }
      return isRestricted ? !~restrictedAttributes.indexOf(curAttribute) : true;
   },
   prepareStringForExectution = function prepareStringForExecution(string) {
      return JSON.stringify(FSC.wrapAroundExec(string, true));
   },
   processDataSequence = function processDataSequence(attributesData, data, isControl, configObject, attributeName) {
      var string = '', attrData = attributesData && attributesData.data, i;
      if (!attrData){
         /**
          * Если в теге нет атрибута data,
          * значит это уже преобразованная строка
          */
         return attributesData;
      }
      if (attrData.length) {
         if (attrData.length === 1) {
            processExpressions(attrData[0], data, this.calculators, this.filename, isControl, configObject, attributeName);
            return attrData[0].value;
         }
         for (i = 0; i < attrData.length; i++) {
            processExpressions(attrData[i], data, this.calculators, this.filename, isControl, configObject, attributeName);
            string += attrData[i].value;
         }
         return string;
      }
      return processExpressions(attrData, data, this.calculators, this.filename, isControl, configObject, attributeName);
   };
   return {
      /**
       * Парсим атрибуты для понимания прокидываемых данных в partial
       * @param attrs
       * @param data
       * @returns {{}}
       */
      parseAttributesForData: function parseAttributesForData(attributes, data, propertyName, restricted) {
         var
            attr,
            obj = {},
            root = 'scope',
            attribs = 'attributes',
            attrData,
            attrName,
            resolved = {},
            tmpObj = {},
            attrs = attributes.attribs,
            restrictedAttributes = [root, attribs, 'class', 'data-access', '_wstemplatename'];

         if (attributes.rootConfig) {
            attributes.rootConfig.esc = false;
         }

         if (attrs !== undefined) {
            if (attrs[root] && attrs[root].data) {
               attrData = attrs[root].data;
               obj = processExpressions(attrData[0], data, this.calculators, this.filename);
               if (utils.isString(obj)) {
                  if (utils.isOptionsExpression(attrData[0])) {
                     obj = FSC.injectFunctionCall('thelpers.filterOptions', [obj]);
                  }
                  resolved.createdscope = obj;
                  resolved.obj = {};
                  obj = {};
               }
            }
            for (attr in attrs) {
               if (attrs.hasOwnProperty(attr) && checkRestrictedAttributes(restricted, restrictedAttributes, attr) && attrs[attr]) {
                  attrName = propertyName ? propertyName + '/' + attr : attr;
                  tmpObj[attr] = processDataSequence.call(this,
                     attrs[attr],
                     data,
                     attributes.isControl,
                     attributes.rootConfig || tmpObj,
                     attrName
                  );
               }
            }
            if (resolved.createdscope) {
               if (utils.isEmpty(tmpObj)) {
                  resolved.obj = obj;
               } else {
                  resolved.obj = utils.plainMergeAttrs(tmpObj, obj);
               }
               return resolved;
            }
         }
         return utils.plainMergeAttrs(tmpObj, obj);
      },
      /**
       * Разбирает выражения Expression служебной информации, заменяя их на
       * вычисленный результат
       * @param {Object} internal Объект служебной информации
       * @param {Object} data
       * @param propertyName
       * @param isControl
       * @param rootConfig
       * @returns {*}
       */
      parseInternalForData: function processInternalForData(internal, data, propertyName, isControl, rootConfig) {
         for (var attr in internal) {
            if (internal.hasOwnProperty(attr)) {
               var attrName = propertyName ? propertyName + '/' + attr : attr;
               internal[attr] = processDataSequence.call(this,
                  internal[attr],
                  data,
                  isControl,
                  rootConfig || internal,
                  attrName
               );
            }
         }

         return internal;
      },
      parseAttributesForDecoration: function parseAttributesForDecoration(attribs, data, decor, isControl, tag) {

         var attrs,
            mayBeToMerge = {},
            needMerge = true,
            result = {
               attributes: {},
               events: {},
               key: FSC.wrapAroundExec('key+"'+tag.key+'"'),
               inheritOptions: FSC.wrapAroundExec('attr?attr.inheritOptions:{}'),
               internal: FSC.wrapAroundExec('attr?attr.internal:{}'),
               context: FSC.wrapAroundExec('attr?attr.context:{}')
         };

         if (attribs) {
            if (utils.checkProp(attribs, 'attributes')) {
               attrs = processDataSequence.call(this, attribs['attributes'], data, undefined, { composite: true });
               //delete attribs['attributes'];
            }
            for(var attr in attribs){
               if (bindExpressions.isBind(attr)) {
                  // Processing bind expression ("bind:...")

                  var sourceFieldName = bindExpressions.getSourceFieldName(attr),
                     targetFieldName = bindExpressions.getTargetFieldName(attribs[attr]),
                     eventAttributeName = bindExpressions.getEventAttributeName(attr);

                  // Add event object for passing options from child to parent
                  var bindEventObject = bindExpressions.getEventObjectForBind.call(this, attribs[attr], attr, data, isControl);
                  if (result.events[eventAttributeName.toLowerCase()] === undefined) {
                     result.events[eventAttributeName.toLowerCase()] = bindEventObject;
                  } else {
                     // If event with the same name already present, add object to the array
                     result.events[eventAttributeName.toLowerCase()].unshift(bindEventObject[0]);
                  }

                  // Create attribute object
                  attribs[sourceFieldName] = {data: [processStatement.processProperty(targetFieldName)], type: "text"};
                  delete attribs[attr];
               } else if (eventExpressions.isEvent(attr)) {
                  var eventObject = eventExpressions.processEventAttribute.call(this, attribs[attr], attr, data, isControl),
                     eventName = attr.toLowerCase();
                  if (result.events[eventName] === undefined) {
                     result.events[eventName] = eventObject;
                  } else {
                     // If event with the same name already present, add object to the array
                     result.events[eventName].push(eventObject[0]);
                  }
                  delete attribs[attr];
               } else if (Expressions.Attr.isAttr(attr)){
                  needMerge = false;
                  result.attributes[attr] = processDataSequence.call(this,
                     attribs[attr],
                     data,
                     isControl,
                     attribs,
                     attr
                  );
                  delete attribs[attr];
               } else if (attr === 'class' || attr === 'tabindex' || attr === 'data-access'){
                  mayBeToMerge["attr:"+attr] = processDataSequence.call(this,
                     attribs[attr],
                     data,
                     isControl,
                     attribs,
                     attr
                  );
               }
            }

            if (needMerge){
               for(var one in mayBeToMerge){
                  if (mayBeToMerge.hasOwnProperty(one)) {
                     result.attributes[one] = mayBeToMerge[one];
                     delete attribs[one.split("attr:")[1]];
                  }
               }
            }
            if (utils.isString(attrs)) {
               result.attributes = FSC.wrapAroundExec(FSC.injectFunctionCall('thelpers.attrExpressions.processMergeAttributes', [attrs, FSC.getStr(result.attributes)]), true);
            }

            result.events = FSC.wrapAroundExec('typeof window === "undefined"?{}:'+FSC.getStr(result.events));

            return result;
         }
         return undefined;
      },
      /**
       * Для проверки существования директивы и её модульной функции, которую можно применять в модулях, например <div if="{{true}}">...</div>
       * @param  {Object} name
       * @return {Function}
       */
      attributeParserMatcherByName: function attributeParserMatcherByName(name) {
         return (name !== undefined) ? this._attributeModules[name].module : false;
      },
      /**
       * Для проверки существования директивыи её функции парсинга, которую можно применять в модулях, например <div if="{{true}}">...</div>
       * @param  {Object} name
       * @return {Function}
       */
      attributeMatcherByName: function attributeParserName(name) {
         return (name !== undefined) ? this._attributeModules[name].parse : false;
      },
      /**
       * Для проверки существования директивы, и её функции парсинга
       * @param  {Object} tag
       * @return {Function}
       */
      parserMatcher: function parserMatcher(tag) {
         return (this._modules[tag.name] !== undefined) ? this._modules[tag.name].parse : false;
      },
      /**
       * Проверяем есть ли атрибуты, для упрощения разбора на этапе парсинга
       * @param entity
       * @returns {*}
       */
      checkForAttributes: function checkForAttributes(entity) {
         if (entity.attribs && isEmptyObject(entity.attribs)) {
            entity.attribs = undefined;
         }
         return entity;
      }
   }
});
