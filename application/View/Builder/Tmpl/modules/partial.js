define('View/Builder/Tmpl/modules/partial',
   [
      'View/Builder/Tmpl/modules/data',
      'View/Builder/Tmpl/expressions/process',
      'View/Builder/Tmpl/modules/utils/parse',
      'View/Builder/Tmpl/modules/data/utils/functionStringCreator',
      'View/Builder/Tmpl/modules/utils/tag',
      'View/Builder/Tmpl/handlers/error',
      'View/Builder/Tmpl/modules/utils/common',
      'View/Builder/Tmpl/modules/utils/template'
   ], function partialLoader(injectedDataForce, processExpressions, parse, FSC, tagUtils, errorHandling, utils, tHelpers) {
      'use strict';
      var partialM = {
         parse: function partialParse(tag) {
            var tagData = tag.children;
            if (tag.name === 'ws:partial' && tag.attribs.template) {
               tag.attribs._wstemplatename = tag.attribs.template;
            }
            function resolveStatement() {
               var res;
               if (tag.attribs._wstemplatename === undefined) {
                  errorHandling("No template tag for partial " + tag.name, this.filename);
               }
               // храню в состоянии название компонента, используется в traverse для локализации (получение локализуемых слов из словаря по имени компонента)
               this._currentPartialName = this._currentPartialName || [];
               var name;
               if (tag.name === 'ws:partial') {
                  name = tag.attribs['template'].replace('optional!', '');
               } else {
                  name = tag.name.replace('ws:', '');
               }
               this._currentPartialName.push(name);
               try {
                  var attribs = this._traverseTagAttributes(tag.attribs);
                  tag.attribs = attribs;
                  if (attribs._wstemplatename.data.length > 0) {
                     return tHelpers.resolveInjectedTemplate.call(this, tag, tagData);
                  }
                  /**
                   * Посмотрим что это за шаблон
                   * html!..., tmpl!...., SBIS3.CONTROLS или инлайн-шаблон
                   */
                  res = tHelpers.checkRequirableTemplate.call(this, tag, tagData);
               } finally {
                  this._currentPartialName.pop();
               }
               return res;
            }
            return function partialResolve() {
               return resolveStatement.call(this);
            };
         },
         module: function partialModule(tag, data, decor) {
            tag.children = tHelpers.reflector(tag.children);

            // Fast way for long strings to find s2 in s1 (with a Z-function).
            // Can move it to helpers and add some tests.
            function stringIndexOf(s1, s2) {
               var s = s2 + s1,
                  n = s.length,
                  z = new Array(n);
               for (var i = 0; i < n; ++i) {
                  z[i] = 0;
               }
               for (var i = 1, l = 0, r = 0; i < n; ++i) {
                  if (i <= r) {
                     z[i] = Math.min(r - i + 1, z[i - l]);
                  }
                  while (i + z[i] < n && s[z[i]] === s[i + z[i]]) {
                     ++z[i];
                  }
                  if (i + z[i] - 1 > r) {
                     l = i;
                     r = i + z[i] - 1;
                  }
               }
               for (i = n - s1.length; i < n; ++i) {
                  if (z[i] === s2.length) {
                     return i - s2.length;
                  }
               }
               return -1;
            }
            function prepareScope(tag, data, decor) {
               var restricted = {
                  partial: tag.name === 'ws:partial'
               } ;
               return injectedDataForce.call(this, {
                  children: tag.injectedData,
                  attribs: tag.attribs,
                  isControl: !!tagUtils.isWsControl(tag),
                  internal: tag.internal
               }, data, restricted);
            }
            function getWsTemplateName(tag) {
               if (tag.name === 'ws:partial') {
                  if(tag.attribs._wstemplatename.data) {
                     return 'ws:' + tag.attribs._wstemplatename.data.value.replace(/^js!/, '');
                  } else {
                     return 'ws:' + tag.attribs._wstemplatename.replace(/^js!/, '');
                  }

               } else {
                  return tag.name;
               }
            }
            function getLibraryModulePath(tag) {
               // extract library and module names from the tag
               return {
                  library: tag.children[0].library,
                  module: tag.children[0].module
               };
            }
            function resolveStatement(decor) {
               var assignModuleVar,
                  injectedTemplate,
                  decorAttribs = tag.decorAttribs || parse.parseAttributesForDecoration.call(this, tag.attribs, data, {}, !!tagUtils.isWsControl(tag), tag),
                  preparedScope = prepareScope.call(this, tag, data),
                  // превращаем объекты с экранированными значениями (¥) в строки для добавления в шаблон
                  decorInternal = (tag.internal && Object.keys(tag.internal).length > 0)
                     ? FSC.getStr(tag.internal) : null,
                  tagIsModule, tagIsWsControl;

               tag.decorAttribs = decorAttribs;

               if (tag.injectedTemplate) {
                  injectedTemplate = processExpressions(
                     tag.injectedTemplate, data, this.calculators, this.filename, undefined, preparedScope
                  );
                  /***
                   * Генерируем внедрённый шаблон с рутовой областью видимости
                   */
                  if (!injectedTemplate) {
                     errorHandling(
                        'Your template variable by the name of "' + tag.injectedTemplate.name.string + '" is empty',
                        this.filename
                     );
                  }
                  assignModuleVar = injectedTemplate.html || injectedTemplate;
                  if (injectedTemplate.data) {
                     preparedScope.__rootScope = injectedTemplate.data;
                  }
                  if (assignModuleVar) {
                     if (utils.isFunction(assignModuleVar)) {
                        return assignModuleVar(preparedScope, decorAttribs);
                     }
                     if (utils.isString(assignModuleVar)) {
                        return tHelpers.syncRequireTemplateOrControl.call(
                           this, assignModuleVar, FSC.getStr(preparedScope),
                           (decor && decor.isMainAttrs?"thelpers.plainMergeAttr(attr,"+FSC.getStr(decorAttribs)+")":FSC.getStr(decorAttribs)), tag
                        );
                     }
                  }
                  errorHandling(
                     'Your template variable by the name of "' + tag.injectedTemplate.name.string + '" is empty',
                     this.filename
                  );
               }

               tagIsModule = tagUtils.isModule(tag);
               tagIsWsControl = tagUtils.isWsControl(tag);

               if (tagIsModule || tagIsWsControl) {
                  var
                     strPreparedScope = FSC.getStr(preparedScope),
                     createType, decorName;

                  if (tagIsModule) {
                     decorName = FSC.getStr(getLibraryModulePath(tag));
                     createType = 'resolver';
                  } else {
                     decorName = '"' + getWsTemplateName(tag) + '"';
                     createType = 'wsControl'
                  }

                  return 'markupGenerator.createControl("' + createType + '", ' +
                     decorName + ', ' +
                     strPreparedScope + ', ' +
                     (decor
                           ? FSC.injectFunctionCall('thelpers.plainMergeAttr', ["attr", FSC.getStr(decorAttribs), "true"])
                           : (FSC.injectFunctionCall('thelpers.plainMergeContext', ["attr", FSC.getStr(decorAttribs)]))
                     ) + ', ' +
                     tHelpers.getTemplateCfg(decorInternal && stringIndexOf(strPreparedScope, decorInternal) !== -1 ? '{}' : decorInternal) +
                     ', context, depsLocal, includedTemplates, thelpers.config), \n';
               }
               if (tagUtils.isTemplate(tag)) {
                  strPreparedScope = FSC.getStr(preparedScope);
                  return 'markupGenerator.createControl("template", "' +
                     tag.attribs._wstemplatename.data.value +
                     '", ' + strPreparedScope + ', ' +
                     (decor
                           ? FSC.injectFunctionCall('thelpers.plainMergeAttr', ["attr", FSC.getStr(decorAttribs), "true"])
                           : (FSC.injectFunctionCall('thelpers.plainMergeContext', ["attr", FSC.getStr(decorAttribs)]))
                     ) + ', ' +
                     tHelpers.getTemplateCfg(decorInternal && stringIndexOf(strPreparedScope, decorInternal) !== -1 ? '{}' : decorInternal) +
                     ', context, depsLocal, includedTemplates, thelpers.config), \n';
                  /*Каждый partial должен создавать свой контекст ключей, поэтому добавляем part_%i текущий ключ*/
               }

               /*признак того, что функции у нас разложены*/
               var callFnArgs = '.call(this, ' +
                  FSC.injectFunctionCall('thelpers.plainMerge', ["Object.create(data || {})", FSC.injectFunctionCall('thelpers.calculateScope', [FSC.getStr(preparedScope), 'thelpers.plainMerge']), "false"]) + ', ' +
                  (decor ?
                     FSC.injectFunctionCall('thelpers.plainMergeAttr', ["attr", FSC.getStr(decorAttribs), "true"]) :
                     (FSC.injectFunctionCall('thelpers.plainMergeContext', ["attr", FSC.getStr(decorAttribs)]) )) + ', ' +
                  'context, isVdom), ';

               if (this.includedFn){
                  return tag.attribs._wstemplatename.data.value+callFnArgs;
               }
               return '(' + 'function f2(data,attr) {' +
                  'var key = attr&&attr.key||"_";' +
                  'thelpers.prepareAttrsForFocus(attr&&attr.attributes, data);' +
                  'var defCollection = {id: [], def: undefined};' +
                  this.getString(tag.children, {}, this.handlers, {}, true)
                  + '}' + ')'+callFnArgs;
            }
            return function partialResolve(decor) {
               return resolveStatement.call(this, decor);
            };
         }
      };
      return partialM;
   });