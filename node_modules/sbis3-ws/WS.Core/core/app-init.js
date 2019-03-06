define('Core/app-init',
   [
      
      'Core/core-merge',
      'Env/Env',
      'Core/Themes/ThemesController',
      'native-css',
      'Core/patchRequireJS',
      'View/Request',
      'View/_Request/createDefault',
      'Controls/Application/StateReceiver',
      'Core/polyfill',
      'Core/polyfill/PromiseAPIDeferred'
   ], function(
      
      cMerge,
      Env,
      ThemesController,
      nativeCss,
      patchRequireJS,
      Request,
      createDefault,
      StateReceiver
   ) {
      'use strict';

      patchRequireJS();

      var req = new Request(createDefault.default(Request));
      req.setStateReceiver(new StateReceiver());
      Request.setCurrent(req);


      /*Это быстрое решение, нужно обдумать еще разок...
      * смысл в том, что Themesontroller должен маршалить данные
      * как и все, но вот всем еще нужны дополнительные зависимости...
      * и получается десериализацию приходится разбивать на 2 части...
      * с зависимостиями и без них.*/
      if(window.receivedStates && window.receivedStates.indexOf) {
         var ti = window.receivedStates.indexOf('ThemesController');
         if (ti > -1) {
            var tiend = window.receivedStates.indexOf(',', ti);
            var themesState = window.receivedStates;
            if (tiend > -1) {
               themesState = '{'+window.receivedStates.substring(ti - 1, tiend)+'}';
            }
            req.stateReceiver.deserialize(themesState);
         }
      }

      function filterNone() {
         return NodeFilter.FILTER_ACCEPT;
      }

      function getAllComments(rootElem) {
         var comments = [];
         // Fourth argument, which is actually obsolete according to the DOM4 standard, is required in IE 11
         var iterator = document.createNodeIterator(rootElem, NodeFilter.SHOW_COMMENT, filterNone, false);
         var curNode = iterator.nextNode();
         while (curNode) {
            comments.push(curNode);
            curNode = iterator.nextNode();
         }
         return comments;
      }

      function parseTheme(path) {
         var splitted = path.split('theme?');
         var res;
         if(splitted.length > 1) {
            res = {
               name: splitted[1],
               hasTheme: true
            };
         } else {
            res = {
               name: path,
               hasTheme: false
            };
         }
         return res;
      }

      if (window.themesActive) {
         nativeCss.load = function (path, require, load, conf) {
            var parseInfo = parseTheme(path);
            var willBeLoadedByVdom = false;
            if(parseInfo.hasTheme) {
               if(ThemesController.getInstance().pushCssThemedAsyncAllThemes) {
                  willBeLoadedByVdom = true;
                  ThemesController.getInstance().pushCssThemedAsyncAllThemes(parseInfo.name.replace(/\.css$/, ''), load);
               } else {
                  ThemesController.getInstance().pushThemedCss(parseInfo.name.replace(/\.css$/, ''));
               }
            } else {
               if(ThemesController.getInstance().pushCssAsync) {
                  willBeLoadedByVdom = true;
                  ThemesController.getInstance().pushCssAsync(path.replace(/\.css$/, ''), load);
               } else {
                  ThemesController.getInstance().pushSimpleCss(path.replace(/\.css$/, ''));
               }
            }
            if(!willBeLoadedByVdom) {
               load(null);
            }
         };
      } else {
         var loadOrigin = nativeCss.load;
         nativeCss.load = function(path, require, load, conf) {
            var fixedCssName = path;
            if(~fixedCssName.indexOf('theme?')) {
               fixedCssName = fixedCssName.replace('theme?', '');
            }
            return loadOrigin(fixedCssName, require, load, conf);
         };
      }


      return function() {
         cMerge(Env.constants, window.wsConfig || {}, { rec: false });

         //TODO: убрать этот костыль когда Дима пофиксит ошибку https://online.sbis.ru/opendoc.html?guid=a7c9a632-f24e-44e2-9a53-285879d789b1
         getAllComments(document.body).forEach(function(elem) {
            elem.parentNode.removeChild(elem);
         });


         Env.loadContents(window.contents, false, {
            resources: wsConfig.resourceRoot
         });
      };
   });
