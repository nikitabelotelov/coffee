define('Core/ExtensionsManager', [
   'Core/helpers/Object/isEmpty',
   'Env/Env',
   'Core/Deferred',
   'optional!Types/source'
], function(isEmptyObject, Env, Deferred, source) {
   /**
    * Менеджер работы с расширениями функционала и навигации.
    * Класс предназначен для синхронной проверки включенных расширений.
    * @public
    * @class Core/ExtensionsManager
    * @author Бегунов А.В.
    * @singleton
    */

   var ExtensionsManager = /** @lends Core/ExtensionsManager.prototype */{
      /**
       * Метод получения расширений функционала и навигации.
       * Работает и на клиенте, и в роутинге при генерации страниц на сервере.
       * @param {String|Array} params Массив идентификаторов расширений.
       * @returns {Object} Объект со значениями расширений
       * @example
       * <pre>
       *    ExtensionsManager.checkExtensions(['param0', 'param1', 'param2']);
       * </pre>
       */
      checkExtensions: function(params) {
         var systemExtensions;

         if (this.extensionsNeeded()) {
            if (Env.constants.isNodePlatform) {
               systemExtensions = process && process.domain && process.domain.req && process.domain.req.systemExtensions;
            } else if (Env.constants.isBrowserPlatform) {
               if (window.systemExtensions && !isEmptyObject(window.systemExtensions)) {
                  systemExtensions = window.systemExtensions;
               }
            }
         }

         systemExtensions = systemExtensions || {};

         if (params){
            var hasExtensions = !!Object.keys(systemExtensions).length;
            var result = {};

            if (!(params instanceof Array)) {
               params = [params];
            }

            for (var i in params) {
               if (params.hasOwnProperty(i)) {
                  var param = params[i];
                  if (hasExtensions) {
                     result[param] = systemExtensions && systemExtensions[param] || false;
                  } else {
                     result[param] = false;
                  }
               }
            }

            return result;
         }

         return systemExtensions;
      },
       /**
        * Загрузка расширений с БЛ.
        */

      loadExtensions: function() {
         var def = new Deferred();

         if (Env.constants.isBrowserPlatform) {
             if ((window.systemExtensions === null || window.systemExtensions === undefined) && Env.constants.systemExtensions) {
                 // здесь делаем запрос на БЛ за правами, значит у нас нет ПП
                 this.getSystemExtensions().addCallback(function (result) {
                     window.systemExtensions = result;
                     def.callback(result);
                 }).addErrback(function (e) {
                    def.errback(e);
                 });
             } else {
                 def.callback(window.systemExtensions || {});
             }
         } else {
             def.callback(null);
         }

         return def;
      },

       /**
        * Проверка надо ли расширения загружать с БЛ.
        */
      extensionsLoaded: function() {
         if (Env.constants.isBrowserPlatform) {
            return !!window.systemExtensions;
         }

         return true;
      },

      /**
       * Получение расширений с БЛ
       * @return {Core/Deferred}
       */
      getSystemExtensions: function() {
         if (!source) {
            throw new Error('Для работы Core/ExtensionsManager нужен модуль Types/source:SbisService');
         }
         var
            def = new Deferred(),
            bl = new source.SbisService({
               endpoint: 'КонфигурацияИнтерфейса'
            });

         def.addErrback(function (e) {
            return e;
         });

         bl.call('Extensions', {})
            .addCallback(function(data) {
               def.callback(data.getScalar());
            })
            .addErrback(function(e) {
               Env.IoC.resolve('ILogger').error('System extensions', 'Transport error', e);
               def.errback(e);
            });

         return def;
      },

      /**
       * Проверяет, нужно ли получать расширения
       * @return {Boolean}
       */
      extensionsNeeded: function() {
         if (Env.constants.isNodePlatform) {
            var serviceConfig;
            try {
               serviceConfig = process.application.getCurrentService();
            } catch (e) {
               // ignore
            }

            return serviceConfig && serviceConfig.extensionsNeeded();
         } else if (Env.constants.isBrowserPlatform) {
            return (window.systemExtensions && !isEmptyObject(window.systemExtensions)) || Env.constants.systemExtensions || false;
         }
      }
   };

   return ExtensionsManager;
});
