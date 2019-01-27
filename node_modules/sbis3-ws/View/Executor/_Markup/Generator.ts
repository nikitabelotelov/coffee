/// <amd-module name="View/Executor/_Markup/Generator" />

// @ts-ignore
import * as timing from 'Core/core-debug';
// @ts-ignore
import * as cConstants from 'Core/constants';
// @ts-ignore
import * as IoC from 'Core/IoC';
// @ts-ignore
import * as Logger from 'View/Logger';

import { ConfigResolver, Common, OptionsResolver, RequireHelper } from '../Utils';
import { Scope, Focus, Attr, Event } from '../Expressions';

const
   cacheModules = {},
   defRegExp = /(\[def-[\w\d]+\])/g,
   focusAttrs = [
      'ws-creates-context',
      'ws-delegates-tabfocus',
      'ws-tab-cycling',
      'ws-no-focus',
      'attr:ws-creates-context',
      'attr:ws-delegates-tabfocus',
      'attr:ws-tab-cycling',
      'attr:ws-no-focus'
   ];

const Generator = {
   createWsControl(name, scope, attributes, context, _deps) {
      throw new Error('Generator.createWsControl is not implemented');
   },
   createTemplate(name, scope, attributes, context, _deps, config) {
      throw new Error('Generator.createTemplate is not implemented');
   },
   createController(name, scope, attributes, context, _deps) {
      throw new Error('Generator.createController is not implemented');
   },
   resolver(tpl, preparedScope, decorAttribs, context, _deps, includedTemplates) {
      throw new Error('Generator.resolver is not implemented');
   },
   joinElements(elements, _preffix) {
      throw new Error('Generator.joinElements is not implemented');
   },
   createTag(tagName, attrs, children, attrToDecorate, tagKey) {
      throw new Error('Generator.createTag is not implemented');
   },
   createText(text) {
      throw new Error('Generator.createText is not implemented');
   },
   createEmptyText() {
      throw new Error('Generator.createEmptyText is not implemented');
   },
   createDirective(text) {
      throw new Error('Generator.createDirective is not implemented');
   },
   escape(value) {
      throw new Error('Generator.escape is not implemented');
   },
   getScope(data) {
      return data;
   },
   chain(out, defCollection) {
      return Promise.all(defCollection.def).then(function chainTrace(defObject: any) {
         return out.replace(defRegExp, function (key) {
            var valKey = defCollection.id.indexOf(key);
            if (defCollection.id[valKey]) {
               return defObject[valKey].result ? defObject[valKey].result : defObject[valKey];
            }
            return '';
         });
      }, function (err) {
         Common.asyncRenderErrorLog(err);
      });
   },
   createControl(type, name, data, attrs, templateCfg, context, deps, includedTemplates, config, contextObj, defCollection) {
      var res;
      data = ConfigResolver.resolveControlCfg(data, templateCfg, attrs);
      data.internal.logicParent = data.internal.logicParent || templateCfg.viewController;
      data.internal.parent = data.internal.parent || templateCfg.viewController;

      attrs.internal = data.internal;
      data = data.user;

      // Здесь можем получить null  в следствии !optional. Поэтому возвращаем ''
      if (name === null) {
         return this.createText('', attrs.key);
      } else {
         // тип контрола - компонент с шаблоном
         if (type === 'wsControl') {
            if (Logger.getLoggerStatus() || Common.isCompat()) {
               res = timing.methodExecutionTime(this.createWsControl, this, [name, data, attrs, context, deps]);
            } else {
               res = this.createWsControl(name, data, attrs, context, deps);
            }
         }
         // типа контрола - шаблон
         if (type === 'template') {
            if (Logger.getLoggerStatus() || Common.isCompat()) {
               res = timing.methodExecutionTime(this.createTemplate, this, [name, data, attrs, context, deps, config]);
            } else {
               res = this.createTemplate(name, data, attrs, context, deps, config);
            }

         }
         // тип контрола - компонент без шаблона
         if (type === 'controller') {
            if (Logger.getLoggerStatus() || Common.isCompat()) {
               res = timing.methodExecutionTime(this.createController, this, [name, data, attrs, context, deps]);
            } else {
               res = this.createController(name, data, attrs, context, deps);
            }
         }
         // когда тип вычисляемый, запускаем функцию вычисления типа и там обрабатываем тип
         if (type === 'resolver') {
            var handl, i;
            if (attrs.events) {
               for (i in attrs.events) {
                  if (attrs.events.hasOwnProperty(i)) {
                     for (handl = 0; handl < attrs.events[i].length; handl++) {
                        if (!attrs.events[i][handl].fn.isControlEvent) {
                           attrs.events[i][handl].toPartial = true;
                        }
                     }
                  }
               }
            }
            if (Logger.getLoggerStatus() || Common.isCompat()) {
               res = timing.methodExecutionTime(this.resolver, this, [name, data, attrs, context, deps, includedTemplates, config, defCollection]);
            } else {
               res = this.resolver(name, data, attrs, context, deps, includedTemplates, config, defCollection);
            }
         }
         if (res !== undefined) {
            return res;
         } else {
            /**
             * Если у нас есть имя и тип, значит мы выполнили код выше
             * Функции шаблонизации возвращают undefined, когда работают на клиенте
             * с уже построенной версткой
             * А вот если нам не передали каких-то данных сюда, то мы ничего не строили,
             * а значит это ошибка и нужно обругаться.
             */
            if (name && type) {
               return this.createText('', attrs.key);
            }
            if (typeof name === 'undefined') {
               IoC.resolve('ILogger').error('Undefined component error', 'Попытка использовать компонент/шаблон, ' +
                  'но вместо компонента в шаблоне в опцию template был передан undefined! ' +
                  'Если верстка строится неправильно, нужно поставить точку останова и исследовать стек вызовов. ' +
                  'По стеку будет понятно, в каком шаблоне и в какую опцию передается undefined');
               return this.createText('', attrs.key);
            }
            throw new Error('MarkupGenerator: createControl type not resolved');
         }
      }
   },
   prepareDataForCreate(tpl, scope, attrs, deps, includedTemplates) {
      var controlClass,
         logicParent,
         dataComponent,
         isSlashes,
         wasOptional,
         parent;
      if (typeof tpl === 'function') {
         controlClass = tpl;
         dataComponent = tpl.prototype ? tpl.prototype._moduleName : '';
      }
      if (typeof tpl === 'string') {
         if (Common.isLibraryModuleString(tpl)) {
            // if this is a module string, it probably is from a dynamic partial template
            // (ws:partial template="{{someString}}"). Split library name and module name
            // here and process it in the next `if tpl.library && tpl.module`
            tpl = Common.splitModule(tpl);
         } else {
            var newname = Common.splitWs(tpl);
            if (newname) {
               tpl = newname;
            }

            if (tpl.indexOf('/') > -1) {
               isSlashes = true;
               if (tpl.indexOf('optional!') > -1) {
                  wasOptional = true;
               }
            }

            tpl = tpl.replace('optional!', '');
            if (includedTemplates && includedTemplates[tpl]) {
               controlClass = includedTemplates[tpl];
            }

            if (!controlClass) {
               controlClass = deps && (deps[tpl] || deps['optional!' + tpl]);
            }

            if (!controlClass) {
               if (!isSlashes || wasOptional || cConstants.compat) {
                  /*
                     * it can be "optional"
                     * can be tmpl!
                     * */
                  if (RequireHelper.defined(tpl)) {
                     controlClass = RequireHelper.require(tpl);
                  }
               } else {
                  try {
                     controlClass = cacheModules[tpl];
                     if (!controlClass) {
                        controlClass = RequireHelper.require(tpl);
                        cacheModules[tpl] = controlClass;
                     }
                  } catch (e) {
                     IoC.resolve('ILogger').warn('Create component', e, e.stack);
                  }
               }
            }
            dataComponent = tpl;

            if (controlClass && controlClass.default && controlClass.default.isWasaby) {
               controlClass = controlClass.default;
            }
         }
      }
      if (typeof tpl === 'object' && tpl && tpl.library && tpl.module) {
         // module type: { library: <requirable module name>, module: <field to take from the library> }
         var moduleName = tpl.library + ':' + tpl.module.join('.');
         if (deps && deps[tpl.library]) {
            controlClass = Common.extractLibraryModule(deps[tpl.library], tpl.module);
         } else if (RequireHelper.defined(tpl.library)) {
            controlClass = Common.extractLibraryModule(RequireHelper.require(tpl.library), tpl.module);
         } else {
            var mod = cacheModules[tpl.library];
            if (mod) {
               controlClass = Common.extractLibraryModule(cacheModules[tpl.library], tpl.module);
            } else {
               moduleName = undefined;
            }
         }
         if (controlClass && controlClass.prototype && !controlClass.prototype.hasOwnProperty('_moduleName')) {
            // Patch controlClass prototype, it won't have a _moduleName the first time it is
            // created, because it was exported in a library
            controlClass.prototype._moduleName = moduleName;
         }
         dataComponent = moduleName;
      }


      var fromOld = controlClass && controlClass.prototype && Common.isCompound(controlClass);

      var controlProperties = Scope.calculateScope(scope, Common.plainMerge) || {};
      if (fromOld) {
         for (var key in attrs.events) {
            controlProperties[key] = attrs.events[key];
         }
      }

      if (!attrs.attributes) {
         attrs.attributes = {};
      }
      Focus.prepareAttrsForFocus(attrs.attributes, controlProperties);
      logicParent = (attrs.internal && attrs.internal.logicParent) ? attrs.internal.logicParent : null;
      parent = (attrs.internal && attrs.internal.parent) ? attrs.internal.parent : null;
      OptionsResolver.resolveInheritOptions(controlClass, attrs, controlProperties);


      if (cConstants.compat) {
         if (controlProperties && controlProperties.enabled === undefined) {
            var internal = attrs.internal;
            if (internal && internal.parent && fromOld) {
               if (internal.parentEnabled !== undefined && controlProperties.allowChangeEnable !== false) {
                  controlProperties.enabled = internal.parentEnabled;
               } else {
                  controlProperties.enabled = true;
               }
            } else if (fromOld && internal.parentEnabled === false) {
               controlProperties.__enabledOnlyToTpl = internal.parentEnabled;
            }
         }

         if (fromOld) {
            var objForFor = attrs.attributes;
            for (var i in objForFor) {
               if (objForFor.hasOwnProperty(i) && Event.isEvent(i)) {
                  controlProperties[i] = objForFor[i];
               }
            }
         }
      }

      return {
         logicParent: logicParent,
         parent: parent,
         attrs: attrs.attributes,
         controlProperties: controlProperties,
         dataComponent: dataComponent,
         internal: attrs.internal,
         controlClass: controlClass,
         compound: !(controlClass && controlClass.isWasaby)
      };
   },
   cutFocusAttributes(attributes, fn, node) {
      focusAttrs.forEach(function (focusAttr) {
         if (attributes.hasOwnProperty(focusAttr)) {
            fn && fn(focusAttr, attributes[focusAttr]);
            delete attributes[focusAttr];
            if (node) {
               node.removeAttribute(focusAttr);
            }
         }
      });
   },
   joinAttrs: Attr.joinAttrs
};

export default Generator;
