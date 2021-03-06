define('View/Builder/Tmpl', [
      'View/Builder/Tmpl/traverse',
      'Env/Env',
      'View/Builder/Tmpl/modules/utils/common',
      'text!View/Builder/Tmpl/modules/templates/file.jstpl',
      'View/Builder/Tmpl/function'],
   function (traversing,
             Env,
             utils,
             file,
             processingToFunction) {
      'use strict';

      file = file.replace(/\r|\n/g, '');
      //замены, которые нужны для поддержки ядра WS.
      //костыль в /ws/ext/requirejs/config.js
      var requireJsSubstitutions = [
         //splittedCore == true
         ['WS.Core/lib/', 'Lib/'],
         ['WS.Core/core/', 'Core/'],

         //splittedCore == false
         ['ws/lib/', 'Lib/'],
         ['ws/core/', 'Core/']
      ];

      /**
       * TODO: Изыгин
       * https://online.sbis.ru/opendoc.html?guid=6b133510-5ff0-4970-8540-d5be30e7587b&des=
       * Задача в разработку 01.06.2017 Поднять юнит тестирование VDOM Обеспечить покрытие тестами и прозрачность кода файлов…
       */

      var tmpl = {
         template: function template(html, resolver, config) {
            var parsed, parsingError;
            try {
               parsed = traversing.parse(html, undefined, true, config.filename);
            } catch (error) {
               parsingError = error;
            }
            return {
               dependencies: traversing.getDependencies(parsed, parsingError),
               handle: function handleTraverse(success, broke) {
                  if (parsingError) {
                     broke(parsingError);
                  } else {
                     traversing.traverse(parsed, resolver, config).addCallbacks(success, broke);
                  }
               }
            };
         },
         func: function func(ast, config) {
            var functionResult;
            processingToFunction.includedFunctions = {};
            functionResult = processingToFunction.getFunction(ast, null, config, null);
            return functionResult;
         },
         clearFunctionFromDeprecated: function(str){
            var n = str.indexOf('/*#DELETE IT START#*/');
            while (n>-1){
               var end = str.indexOf('/*#DELETE IT END#*/');

               str = str.substr(0, n) +  str.substr(end+19);

               n = str.indexOf('/*#DELETE IT START#*/');
            }

            return str;
         },
         getFile: function(text, config, callback, errback, ext){
            if (!ext) {
               ext = 'tmpl';
            }
            errback = errback || function (er) {
               Env.IoC.resolve('ILogger').error('Template', 'Ошибка при парсинге шаблона: ' + er.message, er);
            };

            var finalSync = '',
               self = this;

            var tmplFunc = null,

               resolverControls = function resolverControls(path) {
                  return ext + '!' + path;
               };
            tmpl.template(text, resolverControls, config).handle(function (traversed) {
               try {
                  var finalFile = file;

                  processingToFunction.privateFn = [];
                  processingToFunction.includedFn = {};
                  processingToFunction.privatePrefix = '_private';
                  tmplFunc = tmpl.func(traversed, config);

                  if (!tmplFunc) {
                     Env.IoC.resolve('ILogger').error('Template', 'Шаблон не может быть построен. Не загружены зависимости. Шаблон: ' + text);
                  }

                  var templateFunctionStr = tmplFunc.toString();
                  finalFile = finalFile.replace(/\/\*#FUNCTION#\*\//g, templateFunctionStr);
                  finalFile = finalFile.replace("__EXTMODULE__", ext);


                  templateFunctionStr = '';// += 'templateFunction.includedFunctions = {};';
                  if (tmplFunc.privateFn) {
                     var countFn = 0;
                     for(var j=0;j<tmplFunc.privateFn.length;j++){
                        var oneFn = tmplFunc.privateFn[j].toString();
                        var funcName = '_private' + j.toString();
                        oneFn = oneFn.replace('function anonymous', 'function '+funcName);
                        templateFunctionStr+=oneFn;
                     }
                  }
                  processingToFunction.privateFn = null;
                  finalFile = finalFile.replace(/\/\*#INCLUDEDFUNC#\*\//g, templateFunctionStr);

                  var includedTemplates = '';
                  var includetplLinks = '';
                  if (tmplFunc.includedFn){
                     for (var fnName in tmplFunc.includedFn) {
                        if (tmplFunc.includedFn.hasOwnProperty(fnName)) {
                           includedTemplates += 'function ' + fnName + '(data, attr, context, isVdom)' + tmplFunc.includedFn[fnName];
                           includetplLinks +=  'depsLocal["' + fnName + '"] = ' + fnName +';';
                        }
                     }
                  }
                  finalFile = finalFile.replace(/\/\*#TEMPLATEFUNC#\*\//g, includedTemplates);
                  processingToFunction.includedFn = null;

                  var currentNode = config.fileName.replace(/\.tmpl$/g, '').replace(/\.wml/g, '');
                  for (var i=0;i < requireJsSubstitutions.length;i++) {
                     var pair = requireJsSubstitutions[i];
                     if (currentNode.startsWith(pair[0])) {
                        currentNode = currentNode.replace(pair[0], pair[1]);
                        break;
                     }
                  }

                  finalFile = finalFile.replace(/\/\*#MODULENAME#\*\//g, currentNode);


                  var deps = self.getComponents(text);

                  var depsString = '';
                  if (deps){
                     for (var k=0;k<deps.length;k++) {
                        depsString += 'depsLocal["' + deps[k] + '"] = deps[' + (k + 1) + '];';
                     }
                  }

                  finalFile = finalFile.replace(/\/\*#DEPSTOLOCALVAR#\*\//g, depsString+includetplLinks);

                  deps = ['View/Executor/TClosure'].concat(deps);

                  var depsStr = JSON.stringify(deps);
                  finalFile = finalFile.replace(/\/\*#DEPS#\*\//g, depsStr);


                  finalFile = tmpl.clearFunctionFromDeprecated(finalFile);
                  callback(finalFile);
               } catch (e) {
                  errback(e);
               }
            }, errback);
         },
         getComponents: function getComponents(html, config) {
            var parsed = traversing.parse(html);
            if (config) {
               traversing.config = config;
            }
            return traversing.getComponents(parsed);
         },
         addArgument: utils.addArgument,
         /**
          * Функция восстанавливающая верный порядок аргументов сериализованного шаблона
          * @returns {*}
          */
         addArgumentsConfig: function addArgumentsConfig() {
            var args = Array.prototype.slice.call(arguments);
            return tmpl.addArgument(args[0], args.slice(1));
         },
         getFunction: function (html, configModule, runner) {
            var synchFunction = null,
               resolverControls = function resolverControls(path) {
                  return 'tmpl!' + path;
               },
               errback = function (er) {
                  Env.IoC.resolve('ILogger').error('Template', 'Ошибка при парсинге шаблона: ' + er.message, er);
               };
            tmpl.template(html, resolverControls, {config: configModule}).handle(function (traversed) {
               try {
                  var templateFunction = tmpl.func(traversed, {config: configModule, filename: 'userTemplate'});
                  templateFunction.stable = true;
                  synchFunction = function () {
                     return templateFunction.apply(this, tmpl.addArgument(runner, arguments));
                  };
                  synchFunction.toJSON = function () {
                     return html;
                  };
               } catch (e) {
                  errback(e);
               }
            }, errback);

            if (!synchFunction) {
               Env.IoC.resolve('ILogger').error('Template', 'Шаблон не может быть построен. Не загружены зависимости. Шаблон: ' + html);
            }
            return synchFunction;
         }
      };

      return tmpl;
   });
