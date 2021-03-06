/// <amd-module name="View/Executor/GeneratorCompatible" />

// @ts-ignore
import * as randomId from 'Core/helpers/Number/randomId';
// @ts-ignore
import * as Context from 'Core/Context';
// @ts-ignore
import * as confStorage from 'Core/helpers/Hcontrol/configStorage';
// @ts-ignore
import * as ParserUtilities from 'Core/markup/ParserUtilities';
// @ts-ignore
import * as coreInitializer from 'Core/core-extend-initializer';
// @ts-ignore
import * as ContextBinder from 'Core/ContextBinder';
// @ts-ignore
import { IoC, constants as cConstants } from 'Env/Env';
// @ts-ignore
import * as shallowClone from 'Core/helpers/Function/shallowClone';
// @ts-ignore
import * as Serializer from 'Core/Serializer';
// @ts-ignore
import * as Logger from 'View/Logger';
// @ts-ignore
import * as Request from 'View/Request';

import { Generator, GeneratorText } from './Markup';
import { Attr, Subscriber, Scope, Rights, Decorate, ContextResolver, Focus } from './Expressions';
import { Common, Compatible, Class, RequireHelper } from './Utils';

const GeneratorCompatible = Object.create(Generator);

const voidElements = [
   'area',
   'base',
   'basefont',
   'br',
   'col',
   'command',
   'embed',
   'frame',
   'hr',
   'img',
   'input',
   'isindex',
   'keygen',
   'link',
   'meta',
   'param',
   'source',
   'track',
   'wbr',

   //common self closing svg elements
   'path',
   'circle',
   'ellipse',
   'line',
   'rect',
   'use',
   'stop',
   'polyline',
   'polygon'
];

function isInstOfPromise(entity) {
   return entity && entity.then;
}

function createContextCompatible(ContextConstructor) {
   var contextModuleName = ContextConstructor.prototype._moduleName;
   switch (contextModuleName) {
      case 'OnlinePage/Context/UserInfo':
         return new ContextConstructor(window && (window as any).userInfo || {});
      case 'Controls/Container/Scroll/Context':
         return new ContextConstructor({ pagingVisible: false });
      default:
         return new ContextConstructor({});
   }
}

function resolveContextCompatible(controlClass, currentContext, control) {
   if (typeof currentContext === 'undefined') {//Корневая нода. Не может быть контекста
      return {};
   }
   var contextTypes = controlClass.contextTypes ? controlClass.contextTypes() : {};
   var resolvedContext = {};
   if (!contextTypes) {
      IoC.resolve('ILogger').error(null, 'Context types are not defined');
   } else {
      for (var key in contextTypes) {
         if (!(currentContext[key] instanceof contextTypes[key])) {
            resolvedContext[key] = createContextCompatible(contextTypes[key]);
         } else {
            resolvedContext[key] = currentContext[key];
            if (control) {
               resolvedContext[key].registerConsumer(control);
            }
         }
      }
   }
   return resolvedContext;
}

var originalResolveContext = ContextResolver.resolveContext;
ContextResolver.resolveContext = function () {
   // It is possible to create a VDom control on an old CompoundControl page. In that case we
   // create empty contexts with default options so that the new vdom components would not fail
   var resolver = Common.isCompat() ? resolveContextCompatible : originalResolveContext;
   return resolver.apply(ContextResolver, arguments);
};

function resolveControlName(controlData, attributes) {
   var attr = attributes || {};
   if (controlData && controlData.name) {
      attr.name = controlData.name
   } else {
      if (attributes && attributes.name) {
         controlData.name = attributes.name;
      }
   }
   return attr;
}

function mergeVisible(classStr, visible) {
   if (visible === false) {
      classStr = classStr + ' ws-hidden';
   }
   return classStr;
}

function mergeEnabled(classStr, enabled) {
   if (enabled) {
      classStr = classStr + ' ws-enabled';
   } else {
      classStr = classStr + ' ws-disabled';
   }
   return classStr;
}

function mergeDecOptions(target, source) {
   if (!target || !source) {
      return;
   }
   for (var key in source) {
      if (!source.hasOwnProperty(key)) {
         continue;
      }
      if (target.hasOwnProperty(key)) {
         // Если такая опция уже есть, то игнорируем, за исключением случая с классом. Их склеиваем.
         if (key === 'class' || key === 'attr:class') {
            target[key] = (source[key] || '') + ' ' + (target[key] || '');
         }
      } else {
         target[key] = source[key];
      }
   }
}

function hasMarkupConfig(controlData, external) {
   // Нужна проверка на то, что это функция сгенерирована с помощью dot, а не tmpl и в таком случае вёрстки может и не быть
   // Для контроллеров всегда будет true
   if (external) {
      if (controlData && ((controlData.bindings && controlData.bindings.length) || controlData['hasMarkup'] === 'false')) {
         return 'false';
      }
   }
   return 'true';
}

function resolveDecOptionsClassMerge(decOptions, options, controlData) {
   var
      classStr = (decOptions['attr:class'] ? decOptions['attr:class'] + ' ' : '') +
         (decOptions['class'] ? decOptions['class'] + ' ' : '') +
         (options['className'] ? options['className'] + ' ' : '') +
         (options['cssClassName'] ? options['cssClassName'] + ' ' : '') +
         (controlData && controlData['class'] ? controlData['class'] : ''),
      classMergeFunctions = {
         'visible': mergeVisible,
         'enabled': mergeEnabled
      };
   classStr = Class.removeClassDuplicates(classStr),
      decOptions.class = classStr.trim();

   for (var key in classMergeFunctions) {
      if (classMergeFunctions.hasOwnProperty(key)) {
         decOptions.class = classMergeFunctions[key](decOptions.class, options[key]);
      }
   }

   decOptions.class = decOptions.class.trim();
   if (!decOptions.class) {
      delete decOptions.class;
   }
   return decOptions;
}

function saveParsedOptions(scope, cnstr, newCtr) {
   var id = scope.user.__$config;

   /**
    * Вернем сохранение конфигураций в configStorage
    * если у нас есть for и в этом цикле вставляются кнопки
    * в контентную область какого-то контрола, то их конфигурацию не восттановить,
    * т.к. for был не в легком инстансе.
    */
   var savedCfg = confStorage.getData()[id];

   // В configStorage храним только прикладные опции
   if (!savedCfg) {
      var configStorage = {};
      configStorage[id] = scope.user;
      /**
       * Перестаем заполнять configStorage для vdom контролов
       * на сервере, все данные они подготавливают себе сами,
       * когда контрол лежит в vdom контроле.
       * Если что-то лежит в старом контроле - конфиг вернуть нужно!
       */
      confStorage.merge(configStorage);
   } else {
      scope.user = savedCfg;
   }

   return scope;
}

function generateNode(decOptions) {
   return new ParserUtilities.Node({
      nodeType: 1,
      nodeName: "component",
      startTag: "<component>",
      closeTag: "</component>",
      attributes: decOptions,
      sequence: undefined,
      childNodes: [],
      parentNode: undefined
   });
}

function bindOptions(context, _options, cnstr, defaultInstanceData?) {
   /**
    * Для новых контролов всегда предлагаем строить от контекста, т.к.
    * сейчас переопределены только те контролы, которые по дефолту строятся от контекста
    * Определяем тут, чтобы не расширять набор свойств новых контролов
    */
   var binder, defaultOptions = defaultInstanceData && defaultInstanceData._options || {},
      buildMarkupWithContext = Common.isNewControl(cnstr) || 'buildMarkupWithContext' in _options ? _options.buildMarkupWithContext : defaultOptions.buildMarkupWithContext;

   if (context && context instanceof Context && buildMarkupWithContext !== false) {
      binder = ContextBinder.initBinderForControlConfig(_options);
      _options = binder.getConstructorOptions(context, cnstr, _options);
   } else if (_options.context && _options.context instanceof Context && buildMarkupWithContext !== false) {
      binder = ContextBinder.initBinderForControlConfig(_options);
      _options = binder.getConstructorOptions(_options.context, cnstr, _options);
   }
   return _options;
}

function buildForNewControl(scope, cnstr, decOptions) {
   var _options = scope.user;

   var dfd, result;

   _options['class'] = decOptions['class'];

   // if new control is inside of a CompoundControl it has to have the 'tabindex' option
   // to be revived correctly
   if (scope.internal && scope.internal.hasOldParent && !_options['tabindex']) {
      _options['tabindex'] = decOptions['attr:tabindex'] || decOptions['tabindex'];
   }

   if (!window || !_options.element || _options.element.length === 0) {
      if (!scope.internal || !scope.internal.logicParent) {
         _options.element = generateNode(decOptions);
      } else {
         _options.__$fixDecOptions = decOptions;
      }
   }

   var eventsList = Subscriber.getEventsListFromOptions(_options);
   for (var key in eventsList) {
      if (eventsList.hasOwnProperty(key)) {
         delete _options[key];
      }
   }

   // не регаем тут контрол в паренте, потому что этот контрол нужен только для построения верстки, реальный контрол создастся при первой же синхронизации
   var doNotSetParent = _options.doNotSetParent;
   _options.doNotSetParent = true;

   // применяю биндинги
   _options = bindOptions(_options.linkedContext, _options, cnstr);
   scope.internal = scope.internal || {};
   _options.iWantBeWS3 = true;
   // Мержим служебные и пользовательские опции для BaseCompatible
   var
      instCompat = Compatible.createInstanceCompatible(cnstr, _options, scope.internal),
      inst = instCompat.instance,
      actualOptions = instCompat.resolvedOptions;

   actualOptions.doNotSetParent = doNotSetParent;

   /**
    * TODO: удалить это. По идее, VDOM контролы не должны генерировть строку если они в window
    */
   if (typeof window !== 'undefined') {
      Subscriber.subscribeEvents(inst, scope.internal.logicParent, eventsList);
      /**
       * Вызываем события на сервере. Контролы VDOM должны попадать в это условие только там.
       */
      GeneratorCompatible.saveContext(_options, inst);
   }
   if (inst._template) {
      /**
       * Сделать final проверку
       */
      if (inst.saveOptions) {
         inst.saveOptions(actualOptions);
      } else {
         inst._options = actualOptions;
      }
      if (typeof window !== 'undefined') {
         // костыль, снова применяю биндинги после отката опций на actualOptions
         GeneratorCompatible.saveContext(_options, inst);
      }

      try {
         dfd = inst._beforeMountLimited && inst._beforeMountLimited(actualOptions, scope.templateContext || {});
      } catch (error) {
         Logger.catchLifeCircleErrors('_beforeMount', error);
      }
      inst._beforeMountCalled = true;

      //TODO пропустить через contextResolver(где взять класс?)
      inst.saveInheritOptions(scope.inheritOptions || {});

      var decAttrs = {};
      if (!Attr.checkAttr(decOptions) && !decOptions.__wasOldControl) {
         /**
          * Для серверной верстки. Нам нужно, чтобы у корневого компонента был атрибут data-component
          * а у всех вложенных нет.
          * Таким образом, мы не сможем пересоздать контролы из верстки. Верстка теперь ничего не знает о том, какого типа
          * внутри нее компонент. Но корневой data-component нужен для совместимости
          */
         for (var i in decOptions) {
            if ((i === 'data-component' ||
               i === 'config' ||
               i === 'hasMarkup') &&
               scope.internal && scope.internal.logicParent && scope.internal.logicParent._template) {
               continue;
            }
            decAttrs['attr:' + i] = decOptions[i];
         }
         decOptions = decAttrs;

         /**
          * Это свойство нужно, чтобы не "срезать" data-component у HOC
          * шаблонизатор принудительно запихзивает атрибуты name и sbisname
          * в контролы. Этого делать нельзя. name - это опция.
          * Поэтому мы фильтруем все "не attr:" при создании контрола
          * Если дошли до этой точки - значит мы уже прошлись по атрибутам и там остались только хорошие
          */
         Object.defineProperty(decOptions, '__itsFixedAttrs', {
            value: true,
            enumerable: false,
            configurable: false
         });
      } else {
         for (var i in decOptions) {
            if ((i === 'data-component' ||
               i === 'config' ||
               i === 'hasMarkup') &&
               (!scope.internal || !scope.internal.logicParent || !scope.internal.logicParent._template || scope.internal.hasOldParent)) {
               decOptions['attr:' + i] = decOptions[i];
            }
         }
      }
      /**
       * Понимаем асинхронная ветка или нет
       */
      if (dfd && isInstOfPromise(dfd)) {
         return new Promise(function (resolve) {

            dfd.then(function (receivedState) {
               inst._saveContextObject(ContextResolver.resolveContext(cnstr, scope.templateContext || {}));
               inst.saveFullContext(ContextResolver.wrapContext(inst, scope.templateContext || {}));
               var result;
               inst = Common.plainMerge(inst, receivedState);
               _options.__$receivedState = receivedState;

               if (decOptions && decOptions['attr:component'] && decOptions['attr:component'].indexOf('Controls/Application') > -1) {
                  delete decOptions['config'];
                  delete decOptions['attr:config'];
               }

               let request = Request.getCurrent();
               if (request) {
                  request.stateReceiver.register(scope.key, {
                     getState: function () {
                        return receivedState;
                     },
                     setState: function () {
                     }
                  });
               }

               result = inst._template ? inst.render(null, { attributes: decOptions, key: scope.key }) : '';
               if (result.then) {
                  result.then(function (res) {
                     resolve({
                        result: GeneratorCompatible.makeInlineConfigs(res, scope.key, receivedState),
                        receivedState: receivedState
                     });
                  }, function (err) {
                     Common.asyncRenderErrorLog(err);
                     resolve({
                        result: asyncRenderErrorTag(inst),
                        receivedState: undefined
                     });
                  });
               } else {
                  if (!scope.internal || !scope.internal.logicParent) {
                     GeneratorCompatible.saveConfig(_options.__$config, inst);
                  }
                  /**
                   * Для описания конфигов в script
                   */
                  result = GeneratorCompatible.makeInlineConfigs(result, scope.key, receivedState);
                  resolve({
                     result: result,
                     receivedState: receivedState
                  });
               }
            }, function (err) {
               Common.asyncRenderErrorLog(err);
               resolve({
                  result: asyncRenderErrorTag(inst),
                  receivedState: undefined
               });
            });
         });
      } else {
         inst._saveContextObject(ContextResolver.resolveContext(cnstr, scope.templateContext || {}));
         inst.saveFullContext(ContextResolver.wrapContext(inst, scope.templateContext || {}));
      }
   }

   result = inst._template ? Generator.invisibleNodeCompat(inst.render(undefined, { attributes: decOptions })) : '';

   // Добавлено, чтобы новый контрол (в частности, Controls/Decorator/Markup) в старом окружении не терял атрибуты из шаблона.
   // По задаче https://online.sbis.ru/opendoc.html?guid=d7ec8126-a368-4afc-ba10-881fccd54b0e
   mergeDecOptions(inst._decOptions, decOptions);
   if (cConstants.compat || !scope.internal || !scope.internal.logicParent || confStorage.hasKey(_options.__$config)) {
      GeneratorCompatible.saveConfig(_options.__$config, inst);
      inst.__destory_origin = inst.destroy;
      inst.destroy = function (fromDirtyChecking) {
         var configObj = {};
         configObj[this._options.__$config] = undefined;
         confStorage.merge(configObj);
         this.__destory_origin.apply(this, arguments);
      };
   }
   return result;
}

function buildForOldControl(scope, cnstr, resultingFn, decOptions, controlData) {
   var
      modOptions = cnstr.prototype._modifyOptions,
      _options;

   fixTabindexUsingAttribute(decOptions, scope.user);

   if (decOptions['attr:class'] !== undefined) {
      // compatibility with old controls and _modifyOptions
      decOptions['class'] = decOptions['attr:class'];
   }
   if (scope.user.__enabledOnlyToTpl !== undefined && scope.user.allowChangeEnable !== false) {
      scope.user.enabled = scope.user.__enabledOnlyToTpl;
   }
   scope.internal.isOldControl = true;
   _options = modOptions.call(cnstr.prototype, scope.user, controlData, decOptions);

   if (window && scope.internal.parent && scope.internal.parent._template && _options.element.length > 0) {//Нужны ли инстансы
      var cmpInst = Compatible.createInstanceCompatible(cnstr, _options, scope.internal).instance;
      return '';
   } else {
      decOptions = resolveDecOptionsClassMerge(decOptions, _options, controlData);
      var ctx;
      if (_options.context && _options.context instanceof Context) {
         ctx = _options.context;
      } else if (_options.linkedContext && _options.linkedContext instanceof Context) {
         ctx = _options.linkedContext;
      }
      Object.defineProperty(_options, '__wasOldControl', {
         value: true,
         enumerable: false,
         configurable: false
      });
      for (var i in decOptions) {
         if (i.indexOf("attr:") !== 0) {
            decOptions["attr:" + i] = decOptions[i];
            delete decOptions[i];
         }
      }
      var result = resultingFn.call(scope.internal.parent, _options, { attributes: decOptions, internal: scope.internal }, ctx);

      if (scope.user.__enabledOnlyToTpl !== undefined && scope.user.allowChangeEnable !== false) {
         delete scope.user.enabled;
      }
      return result;

   }
}

function buildForSuperOldControls(scope, cnstr, context, varStorage, decOptions) {
   //нужно ли создавать инстансы(xhtml)
   if (scope.internal && scope.internal.parent && scope.internal.parent._template && window && scope.user.element.length > 0) {
      var inst, _options;
      _options = bindOptions(context, scope.user, cnstr);
      Compatible.createInstanceCompatible(cnstr, _options, scope.internal);
      return '';
   } else {
      // преобразуем родительские опции в форму для старых контролов
      var parentOptions = {
         enabled: scope.internal.parentEnabled,
         visible: scope.internal.parentVisible
      };
      decOptions['hasMarkup'] = 'true';
      return ParserUtilities.buildMarkupForClass(cnstr, scope.user, context, varStorage, parentOptions, undefined, decOptions);
   }
}

function setContext(_options, context) {
   if (context) {
      _options.linkedContext = context;
   } else if (_options.parent && _options.parent.getLinkedContext) {
      _options.linkedContext = _options.parent.getLinkedContext();
   }
}

function fixEnabledOption(_options, internal, defaultInstanceData) {
   /*Фиксим опции только если у нас опция не задана и нет parent,
    если есть parent, контрол родится и сам посмотрит на него и
    задизейблит себя в конструкторе*/
   if (_options.allowChangeEnable === false || _options.allowChangeEnable === "false") {
      return false;
   }
   // если опция по умолчанию defaultInstanceData = false, то тоже не изменяем
   if (defaultInstanceData && defaultInstanceData._options) {
      if (defaultInstanceData._options.allowChangeEnable === false || defaultInstanceData._options.allowChangeEnable === 'false') {
         return false;
      }
   }
   if (internal && _options.enabled === undefined && !internal.parent) {
      _options.enabled = internal.parentEnabled;
      return true;
   }
}

function buildMarkupForClass(cnstr, scope, context, varStorage, decOptions) {
   var resultingFn = getTemplate(cnstr),
      result, _options;

   if (Common.isNewControl(cnstr) || resultingFn.stable) {
      scope = saveParsedOptions(scope, cnstr, Common.isNewControl(cnstr));
   }
   var defaultInstanceData;

   if (!scope.internal || !scope.internal.logicParent || !scope.internal.logicParent._template || !Common.isNewControl(cnstr)) {
      defaultInstanceData = coreInitializer.call(cnstr);
      // применяем на опции биндинги
      _options = bindOptions(context, scope.user, cnstr, defaultInstanceData);
      // @ts-ignore
      _options.element = window ? $('[config="' + decOptions['config'] + '"]') : [];
      setContext(_options, context);
   } else {
      _options = scope.user;
      _options.element = [];
   }

   if (Common.isNewControl(cnstr) || resultingFn.stable) {

      /**
       * После этого шага опции сохранены в конфиг, а это значит, что мы можем положить enabled здесь
       */
      var fix = fixEnabledOption(_options, scope.internal, defaultInstanceData);

      var options = defaultInstanceData ? coreInitializer.getInstanceOptionsByDefaults(cnstr, _options, defaultInstanceData) : _options;
      decOptions = resolveControlName(options, decOptions);
      if (Common.isNewControl(cnstr)) {//Новые контролы
         result = buildForNewControl({
            user: options,
            internal: scope.internal,
            templateContext: scope.templateContext,
            inheritOptions: scope.inheritOptions,
            key: scope.key
         }, cnstr, decOptions);
      } else {//Старые контролы
         var tabNeedMerge = fixTabindexUsingAttribute(decOptions, options);
         result = buildForOldControl({ user: options, internal: scope.internal }, cnstr, resultingFn, decOptions, _options);
         if (!tabNeedMerge) {
            delete options.tabindex;
         }
      }

      if (fix) {
         /**
          * Если в опции добавляли enabled, нужно его удалить.
          * Чтобы он не прилетел в конфиг
          */
         delete _options.enabled;
      }
      //уберём временные поля, добавленные для построения вёрстки
      if (cnstr.prototype._modifyOptionsAfter) {
         cnstr.prototype._modifyOptionsAfter(scope.user);
      }
      return result;
   } else {//Супер-старые контролы
      // remove focus attributes from object
      // ! не вырезаем фокусные атрибуты, для совместимости. чтобы старые компоненты могли работать в новом окружении
      // textMarkupGenerator.cutFocusAttributes(decOptions);

      decOptions = resolveControlName(_options, decOptions);
      fixTabindexUsingAttribute(decOptions, _options);
      result = buildForSuperOldControls({ user: _options, internal: scope.internal }, cnstr, context, varStorage, decOptions);
   }
   return result;
}

function fixTabindexUsingAttribute(decOptions, options) {
   var tabNeedMerge = true;

   if (options.tabindex !== undefined) {
      tabNeedMerge = false;
   }
   if (decOptions['attr:tabindex'] !== undefined) {
      options.tabindex = decOptions['attr:tabindex'];
   }
   if (decOptions['tabindex'] !== undefined) {
      options.tabindex = decOptions['tabindex'];
   }
   if (options.__$config) {
      if (confStorage.hasKey(options.__$config)) {
         if (decOptions['attr:tabindex'] !== undefined) {
            confStorage.getValue(options.__$config).tabindex = decOptions['attr:tabindex'];
         }
         if (decOptions['tabindex'] !== undefined) {
            confStorage.getValue(options.__$config).tabindex = decOptions['tabindex'];
         }
      }
   }
   return tabNeedMerge;
}

function fillNonExistentValues(controlData) {
   var
      bindings = controlData.bindings;
   bindings && bindings.forEach(function (binding) {
      var res = controlData;
      if (binding.bindNonExistent) {
         var path = binding.propName.split('/');
         if (path.length) {
            path.forEach(function (step) {
               if (res.hasOwnProperty(step)) {
                  res = res[step];
               } else {
                  IoC.resolve('ILogger').error('fillNonExistentValues', 'nonexistent value ' + binding.propName + ' can\'t fill');
               }
            });
            binding.nonExistentValue = res;
         } else {
            IoC.resolve('ILogger').error('fillNonExistentValues', 'nonexistent value ' + binding.propName + ' can\'t fill');
         }
      }
   });
}

function findParenWithCfg(ctr) {
   if (ctr && ctr._options && ctr._options.__$config) {
      return ctr._options.__$config;
   } else if (ctr && ctr._parent) {
      return findParenWithCfg(ctr._parent);
   } else {
      return '';
   }
}

function getTemplate(cnstr) {
   return cnstr.prototype._dotTplFn || cnstr.prototype._template;
}

function generateIdWithParent() {
   return randomId('cfg-');
}

/**
 * Если существует другой разрешатель имен в config.js. Мы его найдем и используем для подключения.
 * @param tpl
 * @param includedTemplates
 * @param _deps
 * @param config
 * @returns {*}
 */
function stringTemplateResolver(tpl, includedTemplates, _deps, config) {
   var resolver = config && config.resolvers ? Common.findResolverInConfig(tpl, config.resolvers) : undefined;
   if (resolver) {
      return resolver(tpl);
   } else {
      return Common.depsTemplateResolver(tpl, includedTemplates, _deps, config);
   }
}

/**
 * Создаем строку с тегом для повторного выполнения
 * _beforeMount на клиенте и обработки ошибок
 * @param inst
 * @returns {string}
 */
function asyncRenderErrorTag(inst) {
   var decoratorObject = {}, options;
   if (inst && inst._options) {
      options = inst._options;
      decoratorObject = Decorate.createRootDecoratorObject(
         options['__$config'],
         true,
         options['data-component'],
         {}
      );
   }
   return GeneratorCompatible.createTag('div', { attributes: decoratorObject }, []);
}

function decorateAttrs(attr1, attr2) {
   function wrapUndef(value) {
      if (value === undefined || value === null) {
         return "";
      } else {
         return value;
      }
   }
   var attrToStr = function (attrs) {
      var str = '';
      for (var attr in attrs) {
         if (attrs.hasOwnProperty(attr)) {
            str += (wrapUndef(attrs[attr]) !== '' ? ' ' + (attr + '="' + attrs[attr] + '"') : '');
         }
      }
      return str;
   };
   return attrToStr(GeneratorCompatible.joinAttrs(attr1, attr2));
}

function notOptionalCompatibleControl(name) {
   return !(Common.isString(name) && Common.isOptionalString(Common.splitWs(name)));
}

GeneratorCompatible.createEmptyText = function () {
   return '';
};

GeneratorCompatible.createWsControl = function createWsControl(tpl, scope, attributes, context, _deps) {
   var data = this.prepareDataForCreate(tpl, scope, attributes, _deps);

   Logger.log('createWsControl', [data.dataComponent, data.controlProperties]);
   Logger.log('Context for control', ['', attributes.context]);
   Logger.log('Inherit options for control', ['', attributes.inheritOptions]);

   var dataComponent = data.dataComponent,
      id,
      varStorage = null,
      cnstr = data.controlClass,
      resultingFn = cnstr && cnstr.prototype && getTemplate(cnstr),
      decOptions;

   if (!cnstr && !resultingFn) {
      if (notOptionalCompatibleControl(tpl)) {
         var e = new Error('Попытка создания контрола, у которого отсутствует конструктор и шаблон');
         IoC.resolve('ILogger').error(e.message, e.stack);
      }
      return '';
   }
   if (cnstr && !resultingFn && !Common.isNewControl(cnstr)) {
      fixTabindexUsingAttribute(attributes.attributes, scope);
      return GeneratorCompatible.createController(cnstr, scope, attributes, context, _deps);
   }

   var _options = data.controlProperties;
   if (!_options['data-component']) {
      _options['data-component'] = dataComponent;
   }

   if (!data.logicParent || !data.logicParent._template || !Common.isNewControl(cnstr)) {
      _options = shallowClone(_options);
   }

   /**
    * Опции для dirtyChecking будем прокидывать только в VDOM
    */
   for (var di = 0; _options.hasOwnProperty("__dirtyCheckingVars_" + di); di++) {
      delete _options["__dirtyCheckingVars_" + di];
   }
   if (_options && _options.bindings) {
      for (var i = 0; i < _options.bindings.length; i++) {
         if (_options.bindings[i].propName && _options.bindings[i].propName.indexOf("__dirtyCheckingVars_") > -1) {
            _options.bindings.splice(i, 1);
            i--;
         }
      }
   }
   fillNonExistentValues(_options);
   scope.internal = scope.internal || {};

   if (cConstants.compat || !Common.isNewControl(cnstr) || !data.logicParent || !data.logicParent._template) {
      /*Для слоя совместимости продолжим генерировать ID в противном случае просто подкидываем cfg-123, чтобы не падали юниты*/
      id = generateIdWithParent();
   } else {
      id = 'cfg-123';
   }
   if (Common.isNewControl(cnstr) && data.logicParent && data.logicParent._template || Rights.applyRights(data.attrs, _options)) {
      if (resultingFn) {
         decOptions = Decorate.createRootDecoratorObject(id, hasMarkupConfig(_options, !resultingFn.stable),
            data.attrs && data.attrs['data-component'] || dataComponent, data.attrs);
      } else {
         decOptions = data.attrs;
         delete decOptions['data-component'];
         delete _options['data-component'];
      }
      _options['__$config'] = id;
      if (data.attrs && data.attrs.__wasOldControl) {

         Object.defineProperty(decOptions, '__wasOldControl', {
            value: true,
            enumerable: false,
            configurable: false
         });
      }
      // Значения атрибутов для системы фокусов сбрасываются на дефолтные значения
      Focus.resetDefaultValues(decOptions);
      return buildMarkupForClass(cnstr, {
         user: _options,
         internal: data.internal,
         templateContext: attributes.context,
         inheritOptions: attributes.inheritOptions,
         key: attributes.key
      }, context, varStorage, decOptions);
   } else {
      return '';
   }
};

GeneratorCompatible.createController = function createController(tpl, scope, attributes, context, _deps) {
   var data = this.prepareDataForCreate(tpl, scope, attributes, _deps);

   Logger.log('createController', [data.dataComponent, data.controlProperties]);

   var id = randomId('cfg-'),
      cnstr = data.controlClass,
      varStorage = null,
      decOptions;

   var controlData = data.controlProperties;

   if (!controlData['data-component']) {
      controlData['data-component'] = data.dataComponent;
      data.attrs['data-component'] = data.dataComponent;
   }

   // Значения атрибутов для системы фокусов сбрасываются на дефолтные значения
   Focus.resetDefaultValues(data.attrs);
   Focus.prepareTabindex(data.attrs);
   // remove focus attributes from object
   // ! не вырезаем фокусные атрибуты, для совместимости. чтобы старые компоненты могли работать в новом окружении
   // textMarkupGenerator.cutFocusAttributes(data.attrs);

   /*__dirtyCheckingVars_ - это переменные из внутренних шаблонов. И если там был старый биндинг, то это надо удалить,
   * __dirtyCheckingVars_ должны работать только в vdom*/
   for (var di = 0; controlData.hasOwnProperty("__dirtyCheckingVars_" + di); di++) {
      delete controlData["__dirtyCheckingVars_" + di];
   }
   if (controlData && controlData.bindings) {
      for (var i = 0; i < controlData.bindings.length; i++) {
         if (controlData.bindings[i].propName && controlData.bindings[i].propName.indexOf("__dirtyCheckingVars_") > -1) {
            controlData.bindings.splice(i, 1);
            i--;
         }
      }
   }
   fillNonExistentValues(controlData);
   // нужно чтобы name устанавливался из данных, если он там есть
   attributes = resolveControlName(controlData, data.attrs);
   if (Rights.applyRights(attributes, controlData)) {
      decOptions = Decorate.createRootDecoratorObject(id, 'false', data.dataComponent, attributes);
      return ParserUtilities.buildMarkupForClass(cnstr, controlData, context, varStorage, undefined, undefined, decOptions);
   } else {
      return '';
   }
};

GeneratorCompatible.createTemplate = function createTemplate(name, scope, attributes, context, _deps, config) {
   var resultingFn, resolver = Common.hasResolver(name, config && config.resolvers);
   if (Common.isString(name)) {
      if (resolver) {
         resultingFn = config.resolvers[resolver](name);
      } else {
         // @ts-ignore
         resultingFn = _deps && _deps[name] || require(name);
         if (resultingFn && Common.isOptionalString(name) && !Common.isTemplateString(name)) {
            return this.createWsControl(name.split('js!')[1], scope, attributes, context, _deps);
         }
      }
   } else {
      resultingFn = name;
   }

   if (scope.tabindex === -1 && !scope.hasOwnProperty('_moduleName')) {
      // это опция по умолчанию из Lib/Control, она нам только мешается, -1 она для того чтобы потом при инициализации
      // запустился алгоритм получения минимального табиндекса. эту опцию не задают специально, чтобы перебить опцию во внутреннем шаблоне
      delete scope.tabindex;
   }
   var data = this.prepareDataForCreate(name, scope, attributes, _deps);

   var parent = data.parent,
      resolvedScope = data.controlProperties;
   Logger.log('createTemplate', [Common.isString(name) ? name : 'InlineFunction', data.controlProperties, resultingFn]);
   Logger.log('Context for template', ['', attributes.context]);
   Logger.log('Inherit options for template', ['', attributes.inheritOptions]);
   // Здесь можем получить null  в следствии !optional. Поэтому возвращаем ''
   return resultingFn === null ? '' : (parent ? resultingFn.call(parent, resolvedScope, attributes, context) : resultingFn(resolvedScope, attributes, context));
};

GeneratorCompatible.resolver = function resolver(tpl, preparedScope, decorAttribs, context, _deps, includedTemplates, config, defCollection) {
   var
      isTplString = typeof tpl === 'string',
      isTplModule = Common.isLibraryModule(tpl),
      // нужно для того чтобы не запускать генерацию шаблона на имени модуля
      notModuleString = !(isTplString && Common.isStringModules(tpl)),
      data = this.prepareDataForCreate(tpl, preparedScope, decorAttribs, _deps, includedTemplates),
      resolvedScope = data.controlProperties,
      fn;

   if (isTplString) {
      fn = stringTemplateResolver(tpl, includedTemplates, _deps, config);
   } else if (isTplModule) {
      fn = data.controlClass;
   } else {
      fn = tpl;
   }

   if (Common.isControlClass(fn)) {
      /**
       * Сейчас оживление контролов построено на атрибуте data-component
       * и если вдруг мы туда запишем неправильный moduleName то все упадет
       * Контрол будет создан не от того класса, поэтому для решения проблем такой
       * совместимости пропатчим _moduleName правильным значением
       */
      if (isTplString && tpl.indexOf('js!') !== -1 && !RequireHelper.defined(fn.prototype._moduleName)) {
         fn.prototype._moduleName = tpl.split('js!')[1];
      }
      if (fn.prototype._dotTplFn || fn.prototype._template) {
         return GeneratorCompatible.createWsControl(fn, resolvedScope, decorAttribs, context, _deps);
      } else {
         return GeneratorCompatible.createController(fn, resolvedScope, decorAttribs, context, _deps);
      }
   } else {
      Logger.log('Resolver', [isTplString ? tpl : 'InlineFunction', data.controlProperties, fn]);
      Logger.log('Context for template', ['', decorAttribs.context]);
      Logger.log('Inherit options for template', ['', decorAttribs.inheritOptions]);

      var r;
      if (typeof fn === 'function') {
         r = preparedScope && data.parent ? fn.call(data.parent, resolvedScope, decorAttribs, context, false) :
            fn(resolvedScope, decorAttribs, context, false);
      } else if (fn && typeof fn.func === 'function') {
         r = preparedScope && data.parent ? fn.func.call(data.parent, resolvedScope, decorAttribs, context, false) :
            fn.func(resolvedScope, decorAttribs, context, false);
      } else if (Common.isArray(fn)) {
         r = preparedScope && data.parent ?
            fn.map(function (template) {
               if (typeof template === 'function') {
                  return template.call(data.parent, resolvedScope, decorAttribs, context, false);
               } else if (typeof template.func === 'function') {
                  return template.func.call(data.parent, resolvedScope, decorAttribs, context, false);
               }
               return template;
            })
            :
            fn.map(function (template) {
               if (typeof template === 'function') {
                  return template(resolvedScope, decorAttribs, context, false);
               } else if (typeof template.func === 'function') {
                  return template.func(resolvedScope, decorAttribs, context, false);
               }
               return template;
            });
         r = GeneratorCompatible.joinElements(r, undefined, defCollection);
      } else if (typeof tpl === 'undefined') {
         IoC.resolve('ILogger').error(typeof tpl + ' component error', 'Попытка использовать компонент/шаблон, ' +
            'но вместо компонента в шаблоне был передан ' + typeof tpl + '! ' +
            'Если верстка строится неправильно, нужно поставить точку останова и исследовать стек вызовов. ' +
            'По стеку будет понятно, в каком шаблоне и в какую опцию передается ' + typeof tpl);
         return '';
      } else {
         if (notModuleString) {
            /*Логический родитель может быть только у VDOM*/
            /*Пока существует возможность вставить XHTML внутрь VDOM этой оптимизации быть не может
             if (preparedScope.internal && preparedScope.internal.logicParent) {
             return tpl;
             }*/

            if (!resolvedScope.hasOwnProperty('enabled')) {
               resolvedScope.enabled = decorAttribs.internal.parentEnabled;
            }

            /**
             * dot уходит в прошлое и если он явно не подключен где-то ранее, то мы даже не будем
             * пытаться считать что в строке у нас может быть dot
             * Например, в чистом коде уже нет xhtml и там dot парсер летит просто так
             */
            // @ts-ignore
            if (typeof doT === 'undefined') {
               return ParserUtilities.buildInnerComponents('' + tpl, resolvedScope, context);
            } else {
               /**
                * Если в строке нет ничего, что похоже на dot,
                * то и не будем преобразовывать строку.
                * Например, из нее удаляются \n
                */
               try {
                  // @ts-ignore
                  tpl = (tpl && tpl.indexOf && tpl.indexOf('{{') > -1) ? (doT.template(tpl, undefined, undefined, true))(resolvedScope) : tpl.toString();
               } catch (e) {
                  tpl = tpl.toString();
               }
               return ParserUtilities.buildInnerComponents(tpl, resolvedScope, context);
            }
         } else {
            return tpl.toString();
         }
      }
      return r;
   }
};

GeneratorCompatible.joinElements = function joinElements(elements, key, defCollection) {
   if (Array.isArray(elements)) {
      var res = '';
      elements.forEach(function joinOneElement(element) {
         var id;
         if (Array.isArray(element)) {
            element = GeneratorCompatible.joinElements(element, undefined, defCollection);
         }
         if (element && isInstOfPromise(element)) {
            id = randomId('def-');
            if (!defCollection.def) {
               defCollection.def = [];
            }
            defCollection.def.push(element);
            element = '[' + id + ']';
            defCollection.id.push(element);
         }
         res += (element || '');
      });

      return res;
   } else {
      throw new Error('joinElements: elements is not array');
   }
};
/**
 *
 * @param tag
 * @param attrs Собственные атрибуты
 * @param children
 * @param attr
 * @param defCollection
 * @returns {string}
 */
GeneratorCompatible.createTag = function createTag(tag, attrs, children, attrToDecorate, defCollection, key) {
   if (!attrToDecorate) {
      attrToDecorate = {};
   }
   if (!attrs) {
      attrs = {};
   }

   var mergedAttrs = Attr.processMergeAttributes(attrToDecorate.attributes, attrs.attributes, true);

   Focus.prepareTabindex(mergedAttrs);
   // remove focus attributes from object
   // ! не вырезаем фокусные атрибуты, для совместимости. чтобы старые компоненты могли работать в новом окружении
   // textMarkupGenerator.cutFocusAttributes(mergedAttrs);

   var mergedAttrsStr = mergedAttrs
      ? decorateAttrs(mergedAttrs, {})
      : '';

   if (~voidElements.indexOf(tag)) {
      return '<' + tag + mergedAttrsStr + ' />';
   }
   return '<' + tag + mergedAttrsStr + '>' + GeneratorCompatible.joinElements(children, undefined, defCollection) + '</' + tag + '>';
};

GeneratorCompatible.createText = function createText(text) {
   return text;
};

GeneratorCompatible.createDirective = function createDirective(text) {
   return '<' + text + '>';
};

GeneratorCompatible.createComment = function createComment(text) {
   return '<!--' + text + '-->';
};

GeneratorCompatible.makeInlineConfigs = function makeInlineConfigs(res, optionsConfig, receivedState) {
   var slr = new Serializer(),
      ser = JSON.stringify(receivedState, slr.serialize);

   // заменяем опасные символы, коотрые могут привести к синтаксическим ошибкам
   Common.componentOptsReArray.forEach(function (re) {
      ser = ser.replace(re.toFind, re.toReplace);
   });

   return res +
      '<script type="text/javascript" data-vdomignore="true">window.inline' +
      optionsConfig.replace('cfg-', '') +
      '=\'' +
      ser +
      '\';</script>';

};

GeneratorCompatible.saveConfig = function saveConfig(configId, inst) {
   /**
    * Сохраним инстанс в configStorage
    */
   if (typeof window !== "undefined") {
      var configObj = {};
      configObj[configId] = inst;
      confStorage.merge(configObj);
   }
};

GeneratorCompatible.saveContext = function saveContext(_options, inst) {
   /**
    * После создания легкого инстанса необходимо синхронизовать биндинги если есть контекст
    * чтобы при inst.render() верстка построилась от правильных опций
    */
   var ctx = _options.context || _options.linkedContext;
   if (ctx && ctx instanceof Context) {
      var binder = ContextBinder.initBinderForControlConfig(_options);
      binder.bindControl(inst, ctx, 'syncControl');
   }
};

GeneratorCompatible.calculateScope = function calculateScope(scope) {
   return Scope.calculateScope(scope, Scope.controlPropMerge);
};

GeneratorCompatible.buildMarkupForClass = buildMarkupForClass;

GeneratorCompatible.escape = Common.escape;


// If this module is loaded that means that we need to support compatible stack, so we should
// inject our compatible markup generator behaviour into standalone text markup generator
function injectCompatibleBehavior(destinationMarkupGenerator) {
   var
      store = {},
      fieldName;

   for (fieldName in destinationMarkupGenerator) {
      if (destinationMarkupGenerator.hasOwnProperty(fieldName)) {
         store[fieldName] = destinationMarkupGenerator[fieldName];
      }
   }

   for (fieldName in GeneratorCompatible) {
      if (GeneratorCompatible.hasOwnProperty(fieldName)) {
         destinationMarkupGenerator[fieldName] = (function (fieldName) {
            return function () {
               if (cConstants.compat) {
                  return GeneratorCompatible[fieldName].apply(this, arguments);
               } else {
                  return store[fieldName].apply(this, arguments);
               }
            };
         })(fieldName);
      }
   }
}

if (cConstants.isBrowserPlatform) {
   injectCompatibleBehavior(GeneratorText);
}

export = GeneratorCompatible;
