(function() {

   "use strict";
   var global = (function() {return this || (0,eval)('this');}()),
      define = global.define || (global.requirejs && global.requirejs.define) || (requirejsVars && requirejsVars.define);

   var isWSCore = /\/WS\.Core($|\/)/;

   define("i18n", [
      'Core/i18n',
      'Env/Env',
      'Core/polyfill',
      'text',
      'native-css'
   ], function(i18n, Env) {
      var isOnServer = Env.constants.isNodePlatform || Env.constants.isServerScript;

      return {
         load: function(name, require, onLoad) {
            if ((isOnServer || i18n.isEnabled()) && global.requirejs.s) {

               var curLang = i18n.getLang();

               // На сервисе предствления грузим все языки, на клиенте - лишь нужный
               var langToLoad = isOnServer ? Object.keys(i18n.getAvailableLang()) :
                  i18n.hasLang(curLang) ? [curLang] : [];

               var url = require.toUrl(name + '.js');
               var reqPaths = global.requirejs.s.contexts._.config.paths;
               var reqBaseUrl = global.requirejs.s.contexts._.config.baseUrl;
               var moduleName = '';


               Object.keys(reqPaths).some(function(mod) {

                  var someModule = (reqPaths[mod].startsWith('/') ? '' : reqBaseUrl) + reqPaths[mod] + '/';

                  if (url.startsWith(someModule)) {
                     moduleName = isWSCore.test(someModule) ? 'WS.Core' : mod;
                     moduleName = moduleName === 'Deprecated' ? 'WS.Deprecated' : moduleName;
                     return true;
                  }

                  return false;
               });

               if (!moduleName) {
                  onLoad(i18n.rk.bind(i18n));
                  return;
               }

               if (i18n.isProcessedModule(moduleName)) {
                  i18n.getDictModule(moduleName).addCallback(function() {
                     onLoad(i18n.rk.bind(i18n));
                  });
               } else {
                  i18n.getDictModule(moduleName).addCallback(function(dict) {
                     var pathsToDict = [];

                     langToLoad.forEach(function(langKey) {
                        if (dict.hasOwnProperty(langKey)) {
                           dict[langKey].forEach(function(ext) {
                              var nameDict = i18n.getPathToDict(moduleName, langKey, ext);

                              pathsToDict.push(ext === 'css' ? 'native-css!' + nameDict : nameDict);
                           });
                        }
                     });

                     require(pathsToDict, function() {
                        try {
                           for (var i = 0; i < pathsToDict.length; i++) {
                              if (pathsToDict[i].indexOf('native-css!') === -1) {
                                 i18n.setDict(arguments[i], pathsToDict[i], pathsToDict[i].split('/')[2]);
                              }
                           }

                           onLoad(i18n.rk.bind(i18n));
                        } catch(err) {
                           onLoad.error(err);
                        }
                     }, function(err) {
                        onLoad.error(err);
                     });
                  }).addErrback(function(err) {
                     Env.IoC.resolve('ILogger').error('Localization', 'Не смог загрузить словарь для компонента: ' + name, err);
                     onLoad(i18n.rk.bind(i18n));
                  });
               }
            } else {
               onLoad(i18n.rk.bind(i18n));
            }
         }
      }
   });
})();
