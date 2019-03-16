/// <amd-module name="View/Executor/_Utils/Common" />

// @ts-ignore
import * as RightsManager from 'Core/RightsManager';
// @ts-ignore
import * as isPlainObject from 'Core/helpers/Object/isPlainObject';
// @ts-ignore
import { IoC, constants } from 'Env/Env';

import { Attr } from '../Expressions';

import * as RequireHelper from './RequireHelper';

var
   isProtoSupported = function isProtoSupproted() {
      // @ts-ignore
      return Object.__proto__;
   },
   // Если есть prototype будем идти как для всех
   // При отсутствии поддержки __proto__ отдаем ссылку
   isNewObject = function isNewObject(scope) {
      return (scope && scope.prototype) || isProtoSupported();
   },
   requireIfDefined = function requireIfDefined(tpl) {
      return RequireHelper.defined(tpl) && RequireHelper.require(tpl);
   },
   tryLoadLibraryModule = function tryLoadLibraryModule(tpl, _deps) {
      if (isLibraryModuleString(tpl)) {
         // if tpl is a library module name, check if the library is already loaded in _deps
         // or already defined with require
         var
            libPath = splitModule(tpl),
            library = _deps && _deps[libPath.library] || requireIfDefined(libPath.library);

         // if the library was found, return the requested module from it
         return library && extractLibraryModule(library, libPath.module);
      }
      return null;
   },
   /**
    * Стандартный резолвер для имен, которые передают в partial.
    * @param tpl
    * @param includedTemplates
    * @param _deps
    * @returns {*}
    */
   checkExistingModule = function checkExistingModule(tpl, includedTemplates, _deps) {
      return includedTemplates && includedTemplates[tpl]
         || _deps && (_deps[tpl] || _deps['optional!' + tpl])
         || requireIfDefined(tpl)
         || tryLoadLibraryModule(tpl, _deps);
   },
   moduleNameCheckProceed = function maxNameLengthCheck(tpl, includedTemplates, _deps, config) {
      if (config && config.moduleMaxNameLength) {
         if (tpl.length > config.moduleMaxNameLength) {
            return false;
         }
      }
      return checkExistingModule(tpl, includedTemplates, _deps);
   },
   conventionalStringResolver = function conventionalStringResolver(tpl, includedTemplates?, _deps?, config?) {
      if (tpl && tpl.length) {
         return moduleNameCheckProceed(tpl, includedTemplates, _deps, config);
      }
   };

var entityRightsHandlers = {
   object: {
      getMinAccessLevel: function (object, minLevelDefault) {
         var minAccessLevel;

         if (typeof object['data-access-min-level'] !== 'undefined') {
            minAccessLevel = object['data-access-min-level'];
         } else if (typeof object['dataAccessMinLevel'] !== 'undefined') {
            IoC.resolve('ILogger').info('entityHelpers', 'Для задания минимального уровня доступа для опции, используйте data-access-min-level вместо dataAccessMinLevel.');
            minAccessLevel = object['dataAccessMinLevel'];
         }

         if (typeof minAccessLevel === 'string') {
            minAccessLevel = parseInt(minAccessLevel, 10);
         }
         if (typeof minAccessLevel !== 'number' || isNaN(minAccessLevel)) {
            // если полученный minAccessLevel - не число, возвращаемся ко значению по умолчанию
            minAccessLevel = minLevelDefault;
         }

         return minAccessLevel;
      },
      isAccessible: function (object, minLevel) {
         var
            accessString,
            access;

         if (typeof minLevel === 'undefined') {
            minLevel = 1;
         }
         access = minLevel;

         if (typeof object['data-access'] !== 'undefined') {
            accessString = object['data-access'];
         } else if (typeof object['dataAccess'] !== 'undefined') {
            IoC.resolve('ILogger').info('entityHelpers', 'Для задания зоны доступа для опции, используйте data-access вместо dataAccess.');
            accessString = object['dataAccess'];
         }

         if (typeof accessString === 'string') {
            access = RightsManager.checkAccessRights(accessString.split(','));
         }

         return access >= minLevel;
      },
      iterate: function (object, callback) {
         for (var key in object) {
            if (object.hasOwnProperty(key)) {
               callback(object[key], key, object);
            }
         }
         return object;
      },
      remove: function (object, key) {
         delete object[key];
      }
   },
   array: {
      getMinAccessLevel: function (array, minLevel) {
         return minLevel;
      },
      isAccessible: function () {
         return true;
      },
      iterate: function (array, callback) {
         for (var i = array.length - 1; i >= 0; i--) {
            callback(array[i], i, array);
         }
         return array;
      },
      remove: function (array, index) {
         array.splice(index, 1);
      }
   }
};


export function mapForLoop(array, mapFunction) {
   var arrayLen = array.length,
      newArray = new Array(arrayLen),
      i;
   for (i = 0; i < arrayLen; i++) {
      newArray[i] = mapFunction(array[i], i, array);
   }
   return newArray;
}

export function eachObject(object, modifier) {
   var value;
   for (value in object) {
      if (object.hasOwnProperty(value)) {
         object[value] = modifier(object[value], value);
      }
   }
   return object;
}

export function inArray(array, needle) {
   var i;
   for (i = 0; i < array.length; i++) {
      if (array[i] === needle) {
         return true;
      }
   }
   return false;
}

export function isNode() {
   // @ts-ignore
   return (typeof global !== 'undefined' && Object.prototype.toString.call(global.process) === '[object process]');
}

export function isNumber(string) {
   return /^((?=\.\d|\d)(?:\d+)?(?:\.?\d*)(?:[eE][+-]?\d+)?)$/.test(string.trim());
}

export function isString(string) {
   return (Object.prototype.toString.call(string) === '[object String]');
}

export function isObject(string) {
   return (Object.prototype.toString.call(string) === '[object Object]');
}

export function isFunction(fn) {
   return (Object.prototype.toString.call(fn) === '[object Function]');
}

export function isArray(array) {
   return (Object.prototype.toString.call(array) === '[object Array]');
}

export function removeAllSpaces(string) {
   return string.replace(/\s/g, "");
}

export function notUndefOrNull(value) {
   return value || value === 0 || value === '' || value === false;
}

export function checkProp(object, prop) {
   return object && object[prop] !== undefined;
}

export function isEmpty(obj) {
   for (var prop in obj) {
      if (obj.hasOwnProperty(prop))
         return false;
   }
   return true;
}

export function clone(src) {
   function mixin(dest, source, copyFunc) {
      var name, s, i, empty = {};
      for (name in source) {
         s = source[name];
         if (!(name in dest) || (dest[name] !== s && (!(name in empty) || empty[name] !== s))) {
            dest[name] = copyFunc ? copyFunc(s) : s;
         }
      }
      return dest;
   }

   if (!src || typeof src != "object" || Object.prototype.toString.call(src) === "[object Function]") {
      return src;
   }
   if (src.nodeType && "cloneNode" in src) {
      return src.cloneNode(true);
   }
   if (src instanceof Date) {
      return new Date(src.getTime());
   }
   if (src instanceof RegExp) {
      return new RegExp(src);
   }
   var r, i, l;
   if (src instanceof Array) {
      r = [];
      for (i = 0, l = src.length; i < l; ++i) {
         if (i in src) {
            r.push(clone(src[i]));
         }
      }
   } else {
      r = src.constructor ? new src.constructor() : {};
   }
   return mixin(r, src, clone);
}

export function plainMergeAttrs(inner, attrs) {
   return plainMerge(inner, attrs);
}

export function escape(entity) {
   if (entity && typeof entity === 'string') {
      var tagsToReplace = {
         '<': '&lt;',
         '>': '&gt;',
         "'": '&apos;',
         "\"": '&quot;',
         '{{': '&lcub;&lcub;',
         '}}': '&rcub;&rcub;'
      };
      entity = entity.replace(/&([^#])/g, function escapeReplace(tag, suffix) {
         return '&amp;' + suffix;
      });

      return entity.replace(/({{)|(}})|([<>'"])/g, function escapeReplace(tag) {
         return tagsToReplace[tag] || tag;
      });
   }
   return entity;
}

// Для того чтобы при прогоне второй раз в dot, все конструкции эскейпились
export function escapeParenthesis(entity) {
   if (entity && typeof entity === 'string') {
      var tagsToReplace = {
         '{{': '&lcub;&lcub;',
         '}}': '&rcub;&rcub;'
      };
      return entity.replace(/({{)|(}})/g, function escapeReplace(tag) {
         return tagsToReplace[tag] || tag;
      });
   }
   return entity;
}

export function createNewScope(object) {
   return { __rootScope: object };
}

export function bindingArrayHolder(bindings, value) {
   if (!bindings) {
      bindings = [];
   }
   bindings.push(value);
   return bindings;
}

export function toEqual(eq, to) {
   return eq === to;
}

/**
 * Для поиска резолвера имен в конфине, если он есть.
 * @param name
 * @param resolvers
 * @returns {*}
 */
export function hasResolver(name, resolvers) {
   for (var resolver in resolvers) {
      if (resolvers.hasOwnProperty(resolver)) {
         return name.indexOf(resolver) === 0 ? resolver : undefined;
      }
   }
}

/**
 * Для использования найденного резолвера имен для partial
 * @param name
 * @param resolvers
 * @returns {*}
 */
export function findResolverInConfig(name, resolvers) {
   var resolverName = hasResolver(name, resolvers);
   if (resolverName) {
      return resolvers[resolverName];
   }
}

export function plainMerge(inner, object, cloneFirst?) {
   var copyInner = {},
      prop;
   if (!inner) {
      inner = {};
   }
   if (!object) {
      object = {};
   }

   if (cloneFirst) {
      for (prop in inner) {
         if (inner.hasOwnProperty(prop)) {
            copyInner[prop] = inner[prop];
         }
      }
   } else {
      copyInner = inner;
   }
   for (prop in object) {
      if (object.hasOwnProperty(prop)) {
         copyInner[prop] = object[prop];
      }
   }
   return copyInner;
}

export function plainMergeAttr(inner, object) {
   var copyInner = {},
      prop;
   if (!inner) {
      inner = {};
   }
   if (!object) {
      object = {};
   }

   /*
    * Атрибуты из шаблона не нужны в VDom контролах
    * */
   var isBadOldAttrs = false;
   if (object.attributes && Object.keys(object.attributes).length === 2 && object.attributes['name'] === object.attributes['sbisname']
      && object.attributes['sbisname'] !== undefined) {
      object = {};
   }

   var controlKey;
   if (object.attributes && object.attributes['attr:key']) {
      controlKey = object.attributes['attr:key'];
   }
   controlKey = controlKey || object.key || inner.key;

   return {
      inheritOptions: object.inheritOptions,
      context: inner.context,
      internal: inner.internal,
      systemOptions: {},
      domNodeProps: {},
      key: controlKey,
      attributes: Attr.processMergeAttributes(inner.attributes, object.attributes),
      events: Attr.processMergeAttributes(inner.events, object.events)
   };
}

export function plainMergeContext(inner, object) {
   if (!inner) {
      inner = {};
   }
   if (!object) {
      object = {};
   }
   var controlKey;
   if (object.attributes && object.attributes['attr:key']) {
      controlKey = object.attributes['attr:key'];
   }
   controlKey = controlKey || object.key || inner.key;

   return {
      attributes: object.attributes || {},
      events: object.events || {},
      inheritOptions: inner.inheritOptions,
      internal: inner.internal,
      context: inner.context,
      key: controlKey
   };
}

export function addArgument(value, args) {
   var argArr = Array.prototype.slice.call(args);
   if (argArr[0] === undefined) {
      argArr[0] = undefined;
   }
   if (argArr[1] === undefined) {
      argArr[1] = undefined;
   }
   if (argArr[2] === undefined) {
      argArr[2] = undefined;
   }

   // опция isVdom. если true - будет строить vdom.
   // если ПП, то в любом случае false
   argArr[3] = argArr[3] && !constants.isBuildOnServer;

   argArr.push(value);
   return argArr;
}

export function capitalize(string) {
   return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

export function findInArray(needle, arr) {
   return arr && ~arr.indexOf(needle);
}

export function applyRights(attrs, controlData) {
   var attr = attrs && attrs['data-access'],
      rightsNeeded = RightsManager.rightsNeeded();
   if (attr && rightsNeeded) {
      switch (RightsManager.checkAccessRights(attr.split(','))) {
         case 0:
            return false;
         case 1:
            // Меняем права если "только для чтения", иначе отдадим как есть
            var displayNode = controlData['display'];
            if (displayNode) {
               controlData['readOnly'] = true;
               controlData['enabled'] = true;
               controlData['allowChangeEnable'] = false;
            } else {
               controlData['enabled'] = false;
               controlData['allowChangeEnable'] = false;
            }
            return true;
      }
   }
   this.applyRightsToEntity(controlData, 1);

   // Если по правам были удалены какие-то опции контрола, проверим, нет ли биндинга на эти опции. При обнаружении таких связей - удалим.
   this.removeBindCutOption(controlData);
   return true;
}

export function applyRightsToEntity(entity, minAccessLevel) {
   var
      self = this,
      typeHandler;

   if (Array.isArray(entity)) {
      typeHandler = entityRightsHandlers.array;
   } else if (isPlainObject(entity)) {
      typeHandler = entityRightsHandlers.object;
   } else {
      return entity;
   }

   minAccessLevel = typeHandler.getMinAccessLevel(entity, minAccessLevel);
   if (!typeHandler.isAccessible(entity, minAccessLevel)) {
      return undefined;
   }

   entity = typeHandler.iterate(entity, function (value, index, scope) {
      if (value && value['__isRightsChecked']) {
         return;
      }

      if (isPlainObject(value)) {
         /**
          * Патчим объект "незаметно" для других.
          * Методы перебора не заметят нового свойства, а по прямому прозвону мы его увидим
          * в ИЕ работает :)
          */
         Object.defineProperty(value, '__isRightsChecked', { enumerable: false, value: true });
      }
      scope[index] = self.applyRightsToEntity(value, minAccessLevel);
      if (scope[index] === undefined) {
         typeHandler.remove(scope, index);
      }
   });

   return entity;
}

/**
 * Обходим существующие бинды контрола. Ищем связи с опциями. Если есть бинд на опцию, а опции нет - удалим такой бинд.
 * Исключниями являются бинды которые не смотрят на опции контрола.
 * Опция компонента может быть вырезана правами.
 */
export function removeBindCutOption(controlData) {
   var isPath = false,
      whiteList = [],
      pathTemp,
      bindings,
      bindItem,
      urlBind;

   if (controlData && controlData.bindings && controlData.bindings.length) {
      bindings = controlData.bindings;
      // Осуществляем обход по биндам контрола
      for (var bindNumber = 0, bindlength = bindings.length; bindNumber < bindlength; bindNumber++) {
         isPath = false;
         pathTemp = controlData;
         bindItem = bindings[bindNumber];
         // Если есть путь до опции, разберем его на массив
         if (bindItem.propPath && bindItem.propPath.length) {
            urlBind = bindItem.propName.split('/');
         } else {
            urlBind = [];
         }

         // Отсутствие пути у бинда значит, что он забинден не на опцию компонента. Такой бинд сразу пропускаем.
         if (urlBind.length) {
            // Пытаемся пройти по опциям контрола используя путь который вытащили из бинда
            for (var i = 0, urlLength = urlBind.length; i < urlLength; i++) {
               if (pathTemp.hasOwnProperty(urlBind[i])) {
                  pathTemp = pathTemp[urlBind[i]];
                  if (i + 2 === urlLength) {
                     // Удалось пройти по пути, опция не удалена.
                     isPath = true;
                  }
               } else {
                  break;
               }
            }
         } else {
            isPath = true;
         }

         if (isPath) {
            // Если опция не удалена или бинд смотрит не на опцию контрола - добавляем бинд в белый список
            whiteList.push(bindings[bindNumber]);
         }
      }
      // Заменим массив биндов на "проверенный" массив биндов
      controlData.bindings = whiteList;
   }
}

export function isTemplateString(str) {
   return str.indexOf('wml!') === 0 || str.indexOf('tmpl!') === 0 || str.indexOf('html!') === 0 || str.indexOf('optional!tmpl!') === 0;
}

export function isControlString(str) {
   return str.indexOf('js!') === 0;
}

export function isOptionalString(str) {
   return str.indexOf('optional!') === 0;
}

export function isLibraryModuleString(str) {
   // library module string example: SomeStorage.Library:Module
   var name = str.indexOf('ws:') === 0 ? str.replace('ws:', '') : str;
   return name.indexOf(':') >= 0 && name.indexOf('<') === -1 && name.indexOf(' ') === -1;
}

// для обработки контролов без js, через partial
export function isSlashedControl(str) {
   return str.split('/').length > 1 && !isTemplateString(str) && str.indexOf('<') === -1 && str.indexOf(' ') === -1;
}

export function isStringModules(str, config?) {
   return isOptionalString(str) || isTemplateString(str) || isControlString(str) || isSlashedControl(str) || hasResolver(str, config && config.resolvers);
}

export function isControlClass(controlClass) {
   var prototype = controlClass && controlClass.prototype;
   // Проверка на typeof добавлена в следствии странной ошибки https://inside.tensor.ru/opendoc.html?guid=872a7e36-7487-4362-88d0-eaf0e66cb6b6
   // По какой-то причине проверка controlClass && controlClass.prototype проходила и свойство $constructor вызывалось на undefined.
   if (prototype && typeof prototype !== 'undefined') {
      return prototype.$constructor || prototype._template || controlClass.isWasaby;
   }
   return false;
}

export function isLibraryModule(cfg) {
   return cfg && cfg.library && cfg.module;
}

export function splitModule(string) {
   var
      fullName = string.indexOf('ws:') === 0 ? string.replace('ws:', '') : string,
      librarySplit = fullName.split(':', 2),
      libraryName = librarySplit[0],
      moduleName = librarySplit[1] && librarySplit[1].replace(/\//g, '.'),
      modulePath = moduleName.split('.');

   return {
      library: libraryName,
      module: modulePath,
      fullName: `${libraryName}:${moduleName}`
   };
}

export function extractLibraryModule(library, modulePath) {
   let mod = library;
   modulePath.forEach(function (part) {
      if (mod && mod[part]) {
         mod = mod[part];
      } else {
         throw new Error('Module "' + modulePath.join('.') + '" does not exist in the specified library');
      }
   });
   return mod;
}

export function splitOptional(string) {
   var ws;
   ws = string.split('optional!');
   return ws[1];
}

export function splitJs(string) {
   var ws;
   ws = string.split('js!');
   return ws[1];
}

export function splitWs(string) {
   var ws;
   if (string !== undefined && string.indexOf('ws:') === 0) {
      ws = string.split('ws:');
      return ws[1];
   }
   return undefined;
}

export function correctName(name) {
   var newName = splitWs(name);
   if (newName) {
      return newName;
   }
   return name;
}

export function getConstructor(_deps, name) {
   // @ts-ignore
   var res = _deps && _deps['js!' + name] || RequireHelper.defined('js!' + name) ? require('js!' + name) : require(name);
   if (!res && /optional!/.test(name)) {
      var optionalRequireName = name.split('optional!')[1];
      if (RequireHelper.defined(optionalRequireName)) {
         // @ts-ignore
         res = require(optionalRequireName);
      }
   }
   return res;
}

export function isCompound(ctor) {
   //CompoundControl на прототипе не имеет $constructor, и контролы, унаследовавшиеся от него и не переопределившие
   //$constructor не пройдут эту проверку. Поэтому добавлено поле _isCoreCompound.
   return (ctor.prototype.$constructor && !ctor.prototype._template) || ctor.prototype._dotTplFn || ctor.prototype._isCoreCompound;
}

export function isNewControl(ctor) {
   return !isCompound(ctor);
}

export function asyncRenderErrorLog(err) {
   IoC.resolve('ILogger').error('ASYNC RENDER ERROR', err ? err.toString() : err, err);
}

/**
 * Если результат с optional === false, попробуем без optional!
 * @param tpl
 * @param includedTemplates
 * @param _deps
 * @returns {*}
 */
export function depsTemplateResolver(tpl, includedTemplates, _deps, config) {
   var result = conventionalStringResolver(tpl, includedTemplates, _deps, config);
   if (isOptionalString(tpl) && !result) {
      result = conventionalStringResolver(splitOptional(tpl));
   }
   return result;
}

export function getNamespace(attributes) {
   var nsName = attributes.xmlns || 'http://www.w3.org/1999/xhtml';
   return nsName;
}

export function isCompat() {
   if (constants.isNodePlatform) {
      // @ts-ignore
      return !process.domain || process.domain.req && process.domain.req.compatible !== false;
   } else {
      return constants.compat;
   }
}

export function isOptionsExpression(expr) {
   return expr && expr.name && expr.name.string === '_options';
}

export const componentOptsReArray = [
   {
      toFind: /\\/g, // экранируем слеш первым
      toReplace: '\\\\'
   },
   {
      toFind: /<\/(script)/gi,
      toReplace: '<\\/$1'
   },
   {
      toFind: /'/g,
      toReplace: '\\u0027'
   },
   {
      toFind: /\u2028/g,
      toReplace: '\\u000a'
   },
   {
      toFind: /\u2029/g,
      toReplace: '\\u000a'
   },
   {
      toFind: /\n/g,
      toReplace: '\\u000a'
   },
   {
      toFind: /\r/g,
      toReplace: '\\u000d'
   }
];

