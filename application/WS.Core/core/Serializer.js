/* global Object, Array, Date */
define('Core/Serializer', [
   'require',
   'Core/helpers/Object/isPlainObject',
   'Core/helpers/Number/randomId',
   'Core/library',
   'Env/Env',
   'View/Executor/Utils'
], function(
   require,
   isPlainObject,
   randomId,
   library,
   Env,
   Utils
) {
   var getObjectFunctionHeaderTemplate = function() {
         if (objectFunctionHeaderTemplate === undefined) {
            var objectFunctionHeaderModule = 'View/Executor/Markup';
            objectFunctionHeaderTemplate = Utils.RequireHelper.defined(objectFunctionHeaderModule) ?
               require(objectFunctionHeaderModule).FunctionHeaderTemplate || '' :
               '';
               objectFunctionHeaderTemplate = objectFunctionHeaderTemplate ? objectFunctionHeaderTemplate.replace(/\r/g, '') : '';
         }
         return objectFunctionHeaderTemplate;
      },
      objectFunctionHeaderTemplate,
      Serializer;

   Serializer = function(storage, isServerSide, loader) {
      this._loader = loader || require;
      this._functionStorage = [];
      this._instanceStorage = {};
      this._linksStorage = {};
      this._depsStorage = {};
      this._unresolvedLinks = [];
      this._unresolvedInstances = [];
      this._unresolvedInstancesId = [];
      this._isServerSide = isServerSide;
      if (storage) {
         if (typeof storage === 'object') {
            this._instanceStorage = storage;
         } else {
            throw new Error('Storage must be a object');
         }
      }
      this.serialize = Serializer.serializeWith(this);
      this.deserialize = Serializer.deserializeWith(this);
   };

   /**
    * @member {Function} Загрузчик модулей
    */
   Serializer.prototype._loader = null;

   /**
    * @member {Array.<Function>} Хранилище функций
    */
   Serializer.prototype._functionStorage = null;

   /**
    * @member {Object.<Number, Object>} Хранилище инстансов
    */
   Serializer.prototype._instanceStorage = null;

   /**
    * @member {Object.<Number, Object>} Хранилище ссылок на повторяющиеся инстансы (уже сериализованные)
    */
   Serializer.prototype._linksStorage = null;

   /**
    * @member {Object.<Number, Object>} Хранилище ссылок на произвольные модули
    */
   Serializer.prototype._depsStorage = null;

   /**
    * @member {Array.<Object>} Хранилище неразрешенных ссылок на инстансы
    */
   Serializer.prototype._unresolvedLinks = null;

   /**
    * @member {Array.<Object>} Хранилище сериализованных инстансов
    */
   Serializer.prototype._unresolvedInstances = null;

   /**
    * @member {Array.<Number>} Хранилище идентификаторов сериализованных инстансов
    */
   Serializer.prototype._unresolvedInstancesId = null;

   /**
    * @member {Object.<String, RegExp>} Сигнатуры результатов сериализации через метод toJSON для стандартных JS-объектов
    */
   Serializer.prototype._patterns = {
      'Date': /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:[0-9\.]+Z$/,
      'Function': /^TEMPLATEFUNCTOJSON=functio\S\s*\w+/
   };

   /**
    * Сериалайзер - обеспечивает возможность сериализовать и десериализовать специальные типы
    * @class
    * @name Core/Serializer
    * @public
    * @author Бегунов А.В.
    */

   //FIXME: загшушки для совместимости со старым API
   Serializer.prototype.setDetectContainers = function() {};
   Serializer.prototype.isDetectContainers = function() {};

   /**
    * Replacer для использования в JSON.stringify(value[, replacer]).
    * @param {String} name Название сериализуемого свойства
    * @param {*} value Значение сериализуемого свойства
    * @returns {*}
    * @function
    * @name Core/Serializer#serialize
    */
   Serializer.prototype.serialize = function(name, value) {};

    /**
     *
     * @param self
     * @returns {Function}
     * @function
     * @name Core/Serializer#serializeWith
     */
   Serializer.serializeWith = function(self) {
      return function (name, value) {
         var
            isObject = value && typeof value === 'object',
            plainObject = isObject && isPlainObject(value);

         if (isObject && !Array.isArray(value) && !plainObject) {
            if (self._isServerSide) {
               return;
            }

            var key = randomId();
            self._instanceStorage[key] = value;
            return {
               $serialized$: 'inst',
               id: key
            };
         } else if (typeof value === 'function') {
            if (self._isServerSide) {
               //Не нужна только ошибка. Но и сериализовать не надо
               //Ранее убирали ошибки сериализации функций, поскольку есть преценденты, когда избавиться от этого невозможно
               //Наприер, ListView передает хелперы в шаблон, а там создается контрол со Scope={{...}}
               //Не нужно сериализолвать функции, но и не нужно писать ошибку
               return;
            }
            self._functionStorage.push(value);
            return {
               $serialized$: 'func',
               id: self._functionStorage.length - 1
            };
         } else if (value === Infinity) {
            return {
               $serialized$: '+inf'
            };
         } else if (value === -Infinity) {
            return {
               $serialized$: '-inf'
            };
         }
         else if (value === undefined) {
            return {
               $serialized$: 'undef'
            };
         }
         else if (typeof value === 'number' && isNaN(value)) {
            return {
               $serialized$: 'NaN'
            };
         }
         else if (!isNaN(Number(name)) && Number(name) >= 0 && value === undefined) {
            // В массивах позволяем передавать undefined
            return {
               $serialized$: 'undef'
            };
         }
         else {
            if (isObject) {
               if (value['$serialized$'] === 'func') {
                  self._depsStorage[value.module] = true;
               }
            }
            return self._serializeLink(value);
         }
      };
   };

   /**
    * Reviver для использования в JSON.parse(text[, reviver]).
    * @param {String} name Название десериализуемого свойства
    * @param {*} value Значение десериализуемого свойства
    * @returns {*}
    * @function
    * @name Core/Serializer#deserialize
    */
   Serializer.prototype.deserialize = function(name, value) {};

    /**
     *
     * @param self
     * @returns {Function}
     * @function
     * @name Core/Serializer#deserializeWith
     */
   Serializer.deserializeWith = function(self) {
      return function (name, value) {
         var result = value;
         var isObject = value instanceof Object;

         if (isObject && value.hasOwnProperty('$serialized$')) {
            switch (value.$serialized$) {
               case 'func':
                  if (typeof value.id === 'number' && self._functionStorage[value.id]) {
                     result = self._functionStorage[value.id];
                  } else {
                     var
                        declaration = value.module + ':' + value.path,
                        module, paths, p;
                     try {
                        // Сперва попробуем загрузить модуль.
                        // requirejs.defined здес НЕ помогает (Сюрприз!)
                        // Контрольный пример: define('x', function(){}); requirejs.defined('x') -> false
                        module = self._loader(value.module);
                     } catch (e) {
                        // Если модуля нет - результатом будет исходная декларация модуля
                        // result установится в ветке else, которая ниже - метка (*).
                     }

                     if (module) {
                        // Если модуль загрузили
                        try {
                           // Ищем внутренности
                           result = module;
                           if (value.path) {
                              paths = value.path.split('.');
                              while ((p = paths.shift())) {
                                 // try/catch нам тут нужен если указали кривой путь
                                 result = result[p];
                              }
                           }
                        }
                        catch (e) {
                           throw new Error('Parsing function declaration "' + declaration + '" failed. Original message: ' + e.message);
                        }

                        if (typeof result !== 'function') {
                           throw new Error('Can`t transform "' + declaration + '" declaration to function');
                        } else {
                           result.wsHandlerPath = declaration;
                        }
                     } else {
                        // (*) На сервере на node.js второй вызов requirejs от незагруженного модуля даёт не исключение, а undefined
                        // Если модуля нет - результатом будет исходная декларация модуля.
                        // Стало быть, в первый раз попадём в catch, а второй раз - сюда
                        result = declaration;
                     }
                  }
                  break;
               case 'inst':
                  self._unresolvedInstances.push({
                     scope: this,
                     name: name,
                     value: value
                  });
                  self._unresolvedInstancesId.push(value.id);
                  break;
               case 'link':
                  self._unresolvedLinks.push({
                     scope: this,
                     name: name,
                     value: value
                  });
                  break;
               case '+inf':
                  result = Infinity;
                  break;
               case '-inf':
                  result = -Infinity;
                  break;
               case 'undef':
                  result = undefined;
                  break;
               case 'NaN':
                  result = NaN;
                  break;
               default:
                  throw new Error('Unknown serialized type "' + value.$serialized$ + '" detected');
            }
         }

         if (typeof result === 'string') {
            var backResult = result;
            for (var key in self._patterns) {
               if (self._patterns.hasOwnProperty(key) &&
                  self._patterns[key].test(result)
               ) {
                  switch (key) {
                     case 'Date':
                        var dateValue = new Date(result);
                        if (dateValue.toString() === 'Invalid Date' && Env.detection.isIE) {
                           dateValue = Date.fromSQL(result);
                        }
                        return dateValue;
                     case 'Function':
                        /**
                         * Когда с сервера пришла функция отрежем от ее описания первый кусок и создадим функцию из содержимого
                         * Это режим совместимости без легких инстансов
                         */
                        var start = result.indexOf('{'),
                           args = result.substr(0, start);
                        args = args.substring(args.indexOf('(')+1, args.indexOf(')'));

                        args = args.split(',');
                        var temp = getObjectFunctionHeaderTemplate().replace(/sets/g, args[4])
                                    .replace(/context /g, args[2]).replace(/data/g, args[0]);
                        result = result.slice(start);
                        result = temp + result;


                        var strHelpers = '&&(eval("var thelpers = null;"),',
                           /**
                            * Если мы такое нашли, значит мы пытаемся восстановить минифицированную функцию.
                            * А значит нам нужно понять, какая переменная теперь внутри нее отвечает за thelpers
                            *
                            */
                           thelpersIndex = result.indexOf(strHelpers);

                        if (thelpersIndex===-1){
                           strHelpers = ')eval("var thelpers = null;"),';
                           thelpersIndex = result.indexOf(strHelpers);
                        }

                        var
                           tempvar = '',
                           tIndexEnd = result.indexOf('=', thelpersIndex+strHelpers.length);
                        if (thelpersIndex > -1 && tIndexEnd > -1){
                           tempvar = result.substring(thelpersIndex+strHelpers.length, tIndexEnd);
                           if  (/^\w+$/.test(tempvar)) {
                              result = result.replace(/thelpers/g, tempvar);
                           }
                        }

                        /**
                         * Теперь найдем того, кто отвечает за viewController:v
                         */
                        strHelpers = 'viewController:';
                        thelpersIndex = result.indexOf(strHelpers);
                        tIndexEnd = thelpersIndex + strHelpers.length + 1;
                        if (thelpersIndex > -1 && tIndexEnd > -1) {
                           tempvar = result.substring(thelpersIndex + strHelpers.length, tIndexEnd);
                           if  (/^\w+$/.test(tempvar)) {
                              /*Заменим все viewController+пробел*/
                              result = result.replace(/viewController /g, tempvar);
                              /*Заменим все viewController+РАВНО
                              * не можем заменить viewController просто, потому что
                              * это слово встречается в описании объектов*/
                              result = result.replace(/viewController=/g, tempvar+'=');
                           }
                        }
                        /**
                         * Время depsLocal
                         */
                        var strToFind = ',' + args[2]+',';
                        thelpersIndex = result.lastIndexOf(strToFind);

                        if (thelpersIndex===-1){
                           strToFind = args[2]+',';
                           thelpersIndex = result.lastIndexOf(strToFind);
                        }
                        tIndexEnd = result.indexOf(',', (strToFind).length + thelpersIndex);
                        if (thelpersIndex > -1 && tIndexEnd > -1) {
                           tempvar = result.substring(thelpersIndex + (strToFind).length, tIndexEnd);
                           if  (/^\w+$/.test(tempvar)) {
                              result = result.replace(/depsLocal /g, tempvar);
                           }
                        }

                        /**
                         * Время defCollection
                         */
                        tIndexEnd = result.indexOf('.def&&(');
                        thelpersIndex = tIndexEnd-1;
                        if (thelpersIndex > -1 && tIndexEnd > -1) {
                           tempvar = result.substring(thelpersIndex, tIndexEnd);
                           if  (/^\w+$/.test(tempvar)) {
                              result = result.replace(/defCollection /g, tempvar);
                           }
                        }

                        strToFind = 'var defCollection = {id: [], def: undefined};';
                        thelpersIndex = result.indexOf('var templateCount = 0;');
                        tIndexEnd = result.indexOf(strToFind);
                        if (tIndexEnd>-1 && thelpersIndex>-1) {
                           tempvar = result.substring(thelpersIndex, tIndexEnd+strToFind.length);
                           result = result.replace(tempvar, '');
                        }

                        try {
                           //Если функцию построить не получится, значит это не функция и нужно вернуть строку как было
                           var f = new Function(args, result);
                           /**
                            * Если эта функция - контентная опция внутри заголовка таблицы (например)
                            * то там она вызывается от window и уже над Window делаем Object.create в шаблоне
                            * на итог - FF ругается, что кто-то трогает объект, который как бы Window,
                            * но не Window
                            */
                           var fix = (function (fReal) {
                              return function () {
                                 if (this === window) {
                                    return fReal.apply({}, arguments);
                                 } else {
                                    return fReal.apply(this, arguments);
                                 }
                              };
                           })(f);
                           /**
                            * Пометим функцию, как ту, что пришла с сервера
                            */
                           fix.fromSerializer = true;
                           return fix;
                        } catch(e){
                           return backResult;
                        }
                  }
               }
            }
         }

         //Resolve links and instances at root
         if (name === '' && isObject && Object.keys(this).length === 1) {
            //If root is a special signature it resolves through _resolveInstances() and needs to be assigned later if necessary
            self._resolveLinks();
            self._resolveInstances();

            //In this case result hasn't been assigned and should be resolved from this
            if (result === value) {
               result = this[name];
            }
         }

         return result;
      };
   };

   /**
    * Установка функции toJSON, с помощью которой функция сможет сериализоваться
    * @param {Function} func функция, которой ставится toJSON
    * @param {String} moduleName название модуля, которому принадлежит функция. Записывается с преффиксом js!, html!, ...
    * @param {String} [path] Путь до функции в модуле. Путь может быть не определен, например для html!
    * @function
    * @name Core/Serializer#setToJsonForFunction
    */
   Serializer.setToJsonForFunction = function(func, moduleName, path) {
      func.toJSON = function() {
         var serialized = {
            $serialized$: 'func',
            module: moduleName
         };
         if (path) {
            serialized.path = path;
         }
         return serialized;
      };
   };

   /**
    * Функция, которая превращает строку вида 'SBIS3.EDO.MyPackage:handler' в функцию
    * @param {String} declaration - декларативное описание функции
    * @returns {Function|undefined}
    * @function
    * @name Core/Serializer#getFuncFromDeclaration
    */
   Serializer.getFuncFromDeclaration = function getFuncFromDeclaration(declaration) {
      var
         paths = declaration.split(':'),
         path,
         result,
         module,
         p;

      try {
         // Сперва попробуем загрузить модуль.
         // requirejs.defined здес НЕ помогает (Сюрприз!)
         // Контрольный пример: define('x', function(){}); requirejs.defined('x') -> false
         module = require(paths[0]);
      } catch (e) {
         // Если модуля нет - результатом будет исходная декларация модуля
         // result установится в ветке else, которая ниже - метка (*).
      }

      if (module) {
         // Если модуль загрузили
         try {
            // Ищем внутренности
            result = module;
            if (paths[1]) {
               path = paths[1].split('.');
               while ((p = path.shift())) {
                  // try/catch нам тут нужен если указали кривой путь
                  result = result[p];
               }
               if (typeof result === 'function') {
                  if (!result.toJSON) {
                     Serializer.setToJsonForFunction(result, paths[0], paths[1]);
                  }
                  result.wsHandlerPath = declaration;
               }
            }
         }
         catch (e) {
            throw new Error('Parsing function declaration "' + declaration + '" failed. Original message: ' + e.message);
         }

         if (typeof result !== 'function') {
            throw new Error('Can`t transform "' + declaration + '" declaration to function');
         }
      } else {
         // (*) На сервере на node.js второй вызов requirejs от незагруженного модуля даёт не исключение, а undefined
         // Если модуля нет - результатом будет исходная декларация модуля.
         // Стало быть, в первый раз попадём в catch, а второй раз - сюда
         result = declaration;
      }

      return result;
   };

   Serializer.parseDeclaration = function(declaration) {
      return library.parse(declaration);
   };

   /**
    * Проверяет, что значение является ссылкой на ранее сериализованный экземпляр.
    * @param {*} value Сериализованное значение
    * @returns {*}
    * @protected
    */
   Serializer.prototype._serializeLink = function(value) {
      if (
         value &&
         typeof value === 'object' &&
         value.$serialized$ === 'inst' &&
         value.hasOwnProperty('id')
      ) {
         var id = value.id;
         if (this._linksStorage.hasOwnProperty(id)) {
            return {
               $serialized$: 'link',
               id: id
            };
         } else {
            this._linksStorage[id] = value;
         }
      }

      return value;
   };

   /**
    * Заменяет сериализованные ссылки на сериализованные экземпляры
    * @protected
    */
   Serializer.prototype._resolveLinks = function() {
      var link, i, index;
      for (i = 0; i < this._unresolvedLinks.length; i++) {
         link = this._unresolvedLinks[i];
         index = this._unresolvedInstancesId.indexOf(link.value.id);

         if (index === -1) {
            throw new Error('Can\'t resolve link for property "' + link.name + '" with instance id "' + link.value.id + '".');
         }
         link.scope[link.name] = link.value = this._unresolvedInstances[index].value;
         this._unresolvedInstances.splice(1 + index, 0, link);
         this._unresolvedInstancesId.splice(1 + index, 0, link.value.id);
      }

      this._unresolvedLinks.length = 0;
   };

   /**
    * Заменяет сериализованные экземпляры на десериализованные
    * @protected
    */
   Serializer.prototype._resolveInstances = function() {
      var Module,
         parts,
         instance,
         item;
      for (var i = 0; i < this._unresolvedInstances.length; i++) {
         item = this._unresolvedInstances[i];
         instance = null;

         if (this._instanceStorage[item.value.id]) {
            instance = this._instanceStorage[item.value.id];
         } else if (item.value.module) {
            try {
               parts = library.parse(item.value.module);
               Module = this._loader(parts.name);
               if (!Module) {
                  throw new Error('The module "' + parts.name + '" is not loaded yet.');
               }
               if (Module.__esModule && Module.default) {
                  Module = Module.default;
               }
               parts.path.forEach(function(element) {
                  if (!(element in Module)) {
                     throw new Error('The path element "' + element + '" is not found.');
                  }
                  Module = Module[element];
               });
               if (!Module.prototype) {
                  throw new Error('The module "' + item.value.module + '" is not a constructor.');
               }
               if (typeof Module.prototype.fromJSON !== 'function') {
                  throw new Error('The prototype of module "' + item.value.module + '" doesn\'t have fromJSON() method.');
               }
               instance = Module.prototype.fromJSON.call(Module, item.value);
            } catch(e){
               Env.IoC.resolve('ILogger').error('Core/Serializer', e.stack || e);
               instance = null;
            }
            this._instanceStorage[item.value.id] = instance;
         }

         item.scope[item.name] = item.value = instance;
      }

      this._unresolvedInstancesId.length = 0;
      this._unresolvedInstances.length = 0;
   };

   return Serializer;
});
