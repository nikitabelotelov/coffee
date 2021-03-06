/**
 * Created by Shilovda on 08.07.2015.
 */

(function() {

  'use strict';
   var global = (function(){ return this || (0,eval)('this'); }()),
       define = global.define || (global.requirejs && global.requirejs.define) || (requirejsVars && requirejsVars.define),
       busy = false,
       queue = [],
       preloaded = [];

   define('preload', [
      'Core/ParallelDeferred',
      'Core/moduleStubs',
      'View/Executor/Utils',
      'Env/Env',
      'Core/i18n',
      'Core/Deferred'
   ], function(ParallelDeferred, moduleStubs, Utils, Env, i18n) {
      if (typeof window == 'undefined') {
         return {
            load: function(n, r, load) {
               load(function() {});
            }
         };
      }
      var langRegExp = /lang\/([a-z]{2}-[A-Z]{2})/,
         currentLocale = i18n.getLang();

      /**
       * Грузим зависимости
       * busy - говорит о том, что цепочка занята, и просто будем копить все модули для подзагрузки до тех пор,
       * пока цепочка не выполнится, после запустим еще раз метод и возьмем новые модули из очереди.
       * Это позволит сократить количество GET запросов
       */
      function load() {
         if (busy) {
            return;
         }

         busy = true;

         var items = queue.splice(0, 100);

         if (!items.length) {
            busy = false;
            return;
         }

         var pd = new ParallelDeferred({
                maxRunningCount: 1,
                stopOnFirstError: false
             });
         // отфильтруем все языковые модули не для текщей локали
         items = items.filter(function(item){
            var matchLangModule = item.module.match(langRegExp);
            return (!matchLangModule || (matchLangModule && matchLangModule[1] == currentLocale))
         });

         items.forEach(function(item) {
            pd.push(function() {
               return moduleStubs.require(item.module);
            });
         });

         pd.done().getResult().addCallback(function () {
            busy = false;
            load();
         });
      }

      /**
       * Пушим модули в очередь
       * Запускаем ParallelDeferred с шагом 1
       * Позволяет использовать всего 1 сокет для загрузки
       * @param {Array} items
       */
      function push(items) {
         if (items.length) {
             queue = queue.concat(items);
             load();
         }
      }

      /**
       * Получаем зависимости с роутинга.
       * На роутинге будет вызван метод получения всех зависимостей модуля и развернуты в плоский список.
       * Запустим этот список в цепочку на загрузку.
       * @return {Core/Deferred}
       */
      function getDependencies(items) {
         // Отфильтруем те, которые уже были подцеплены, и их вызвали по require
         items = items.filter(function(item) {
            if (!Utils.RequireHelper.defined(item) && preloaded.indexOf(item) === -1) {//пока модуль не загрузится он не будет defined а за это время его могут еще раз спросить
               preloaded.push(item);
               return true;
            }
            return false;
         });

         if (items.length) {
            var xhr = new XMLHttpRequest();
            var appRoot = window.wsConfig && window.wsConfig.appRoot || '/';
            var ver = Env.constants.buildnumber ? '&v=' + Env.constants.buildnumber : '';
            xhr.open('GET', encodeURI(appRoot + 'depresolver/?modules=' + JSON.stringify(items) + '&lightload=1' + ver), true);

            xhr.onreadystatechange = function() {
               if (xhr.readyState == 4) {
                  if (xhr.status >= 200 && xhr.status < 400) {
                     try {
                        var result = JSON.parse(xhr.responseText);
                        push(result);
                     } catch (err) {
                        onError(err);
                     }
                  } else {
                     var err = new Error(xhr.responseText);
                     err.code = xhr.status;
                     onError(err);
                  }
               }
            };
            xhr.send(null);
         }
      }

      function onError(err) {
         if (err.message.indexOf('DOCTYPE') > -1) {
            // Предположительно вместо ошибки нам пришла страница с ошибкой
            Env.IoC.resolve('ILogger').error('Preloader', 'Unknown error with code: ' + err.code);
         } else {
            Env.IoC.resolve('ILogger').error('Preloader', err.message);
         }
      }

      /**
       * Инициируем загрузку зависимостей
       * @param {Array} items
       */
      function preload(items) {
         getDependencies(items);
      }

      return {
         load: function(name, require, onLoad) {
            name = name.split(';');
            if (!window.preprocessor) {
               onLoad(function() {moduleStubs.require(name);});
            } else {
               onLoad(function() {preload(name);});
            }
         }
      }
   });
})();
