/// <amd-module name="View/Executor/_Markup/Vdom/Generator" />

// @ts-ignore
import * as flatten from 'Core/helpers/Array/flatten';
// @ts-ignore
import * as IoC from 'Core/IoC';
// @ts-ignore
import * as Logger from 'View/Logger';

import Generator from '../Generator';
import { Attr, Focus } from '../../Expressions';
import { Vdom, Common, OptionsResolver } from '../../Utils';

/**
 * TODO:: Ответственный Шипин
 * Рефакторинг и обложить тестами
 * https://online.sbis.ru/opendoc.html?guid=4d88c2b4-4e44-463f-bf11-7f0f93cc84f1&des=
 * Задача в разработку 01.06.2017 Покрыть основной функционал VDOM шаблонизатора тестами типа вход-выход…
 * @type {Generator}
 */
const GeneratorVdom = Object.create(Generator);

var keys = [], preffix = '';

GeneratorVdom.createEmptyText = function (key) {
   return GeneratorVdom.createText('', key);
};

GeneratorVdom.createWsControl = function createWsControl(name, scope, attrs, context, deps) {
   var data = this.prepareDataForCreate(name, scope, attrs, deps);
   var controlClass = data.controlClass;

   Logger.log('createWsControl', [data.dataComponent, data.controlProperties]);
   Logger.log('Context for control', ['', attrs.context]);
   Logger.log('Inherit options for control', ['', attrs.inheritOptions]);

   if (!controlClass) {
      return GeneratorVdom.createText('', data.controlProperties && data.controlProperties.__key || attrs.key);
   }

   var compound = data.compound,
      controlProperties = data.controlProperties;
   return {
      compound: compound,
      invisible: false,
      controlClass: controlClass,
      controlProperties: controlProperties, // прикладные опции контрола
      controlInternalProperties: data.internal, // служебные опции контрола
      controlAttributes: data.attrs,
      controlEvents: attrs.events,
      key: controlProperties.__key || attrs.key,
      controlNodeIdx: -1,
      context: attrs.context,
      inheritOptions: attrs.inheritOptions
   };
};

GeneratorVdom.createTemplate = function createTemplate(name, scope, attributes, context, _deps) {
   var resultingFn;
   if (Common.isString(name)) {
      // @ts-ignore
      resultingFn = _deps && _deps[name] || require(name);
      if (resultingFn && Common.isOptionalString(name) && !Common.isTemplateString(name)) {
         return this.createWsControl(name.split('js!')[1], scope, attributes, context, _deps);
      }
   } else {
      resultingFn = name;
   }

   var data = this.prepareDataForCreate(name, scope, attributes, _deps);

   Logger.log('createTemplate', [Common.isString(name) ? name : 'InlineFunction', data.controlProperties, resultingFn]);
   Logger.log('Context for template', ['', attributes.context]);
   Logger.log('Inherit options for template', ['', attributes.inheritOptions]);

   // Здесь можем получить null  в следствии !optional. Поэтому возвращаем ''
   if (resultingFn == null) {
      return '';
   }

   //Если мы имеем подшаблоны только для красоты, а не для DirtyChecking тогда мы хотим увеличивать один и тот же итератор
   //в разных шаблонах, а значит они не должны разрываться DirtyCheckingом
   if (data.controlProperties.__noDirtyChecking) {
      return this.resolver(resultingFn, data.controlProperties, attributes, context, _deps);
   }

   var obj = {
      compound: false,
      template: resultingFn,
      controlProperties: data.controlProperties,
      parentControl: data.parent,
      attributes: attributes,
      context: attributes.key,
      type: 'TemplateNode'
   };

   Object.defineProperty(obj, 'count', {
      configurable: true,
      get: function () {
         var descendants = 0;
         if (this.children) {
            for (var i = 0; i < this.children.length; i++) {
               var child = this.children[i];
               descendants += child.count || 0;
            }
            return this.children.length + descendants;
         } else {
            return 0;
         }
      }
   });

   return obj;
};

GeneratorVdom.createController = function createController(name, scope, attributes, context, _deps) {
   return GeneratorVdom.createWsControl.apply(this, arguments);
};

GeneratorVdom.resolver = function resolver(tpl, preparedScope, decorAttribs, context, _deps, includedTemplates, config) {
   var data = this.prepareDataForCreate(tpl, preparedScope, decorAttribs, _deps, includedTemplates);
   var resolvedScope = data.controlProperties;

   var
      isTplString = typeof tpl === 'string',
      isTplModule = Common.isLibraryModule(tpl),
      fn;

   if (isTplString) {
      fn = Common.depsTemplateResolver(tpl, includedTemplates, _deps, config);
   } else {
      fn = data.controlClass;
   }

   if (!fn) {
      if (typeof tpl === 'function') {
         fn = tpl;
      } else if (tpl && typeof tpl.func === 'function') {
         fn = tpl;
      } else if (Common.isArray(tpl)) {
         fn = tpl;
      }
   }

   if (Common.isControlClass(fn)) {
      return GeneratorVdom.createWsControl(fn, resolvedScope, decorAttribs, context, _deps);
   } else {
      Logger.log('Resolver', [isTplString ? tpl : 'InlineFunction', data.controlProperties, fn]);
      Logger.log('Context for template', ['', decorAttribs.context]);
      Logger.log('Inherit options for template', ['', decorAttribs.inheritOptions]);

      var parent = data.parent;
      if (typeof fn === 'function') {
         return parent ? fn.call(parent, resolvedScope, decorAttribs, context, true, undefined) : fn(resolvedScope, decorAttribs, context, true);
      } else if (fn && typeof fn.func === 'function') {
         return parent ? fn.func.call(parent, resolvedScope, decorAttribs, context, true, undefined) : fn.func(resolvedScope, decorAttribs, context, true);
      } else if (Common.isArray(fn)) {
         var res = parent ?
            fn.reduce(function (prev, next) {
               if (typeof next === 'function') {
                  return prev.concat(next.call(parent, resolvedScope, decorAttribs, context, true));
               } else if (typeof next.func === 'function') {
                  return prev.concat(next.func.call(parent, resolvedScope, decorAttribs, context, true));
               }
               return prev.concat(next);
            }, [])
            :
            fn.reduce(function (prev, next) {
               if (typeof next === 'function') {
                  return prev.concat(next(resolvedScope, decorAttribs, context, true));
               } else if (typeof next.func === 'function') {
                  return prev.concat(next.func(resolvedScope, decorAttribs, context, true));
               }
               return prev.concat(next);
            }, []);
         return res;
      } else if (typeof tpl === 'undefined') {
         IoC.resolve('ILogger').error(typeof tpl + ' component error', 'Попытка использовать компонент/шаблон, ' +
            'но вместо компонента в шаблоне был передан ' + typeof tpl + '! ' +
            'Если верстка строится неправильно, нужно поставить точку останова и исследовать стек вызовов. ' +
            'По стеку будет понятно, в каком шаблоне и в какую опцию передается ' + typeof tpl);
         return GeneratorVdom.createText('', decorAttribs.key);
      } else {
         // create text node, if template is some text
         return GeneratorVdom.createText(tpl, decorAttribs.key);
      }
   }
};

GeneratorVdom.joinElements = function joinElements(elements, _preffix) {
   if (Array.isArray(elements)) {
      keys = [];
      preffix = _preffix || '';
      /* Partial может вернуть массив, в результате чего могут появиться вложенные массивы.
       Поэтому здесь необходимо выпрямить массив elements */
      elements = flatten(elements, true);
      return elements;
   } else {
      throw new Error('joinElements: elements is not array');
   }
};

GeneratorVdom.createTag = function createTag(tagName, attrs, children, attrToDecorate, defCollection, control) {
   if (!attrToDecorate) {
      attrToDecorate = {};
   }
   if (!attrs) {
      attrs = {};
   }

   var mergedAttrs = Attr.mergeAttrs(attrToDecorate.attributes, attrs.attributes);
   var mergedEvents = Attr.mergeEvents(attrToDecorate.events, attrs.events);

   Focus.prepareTabindex(mergedAttrs);

   //Убрать внутри обработку event
   var props = {
      attributes: mergedAttrs,
      hooks: {},
      events: mergedEvents || {}
   },
      isKeyAttr = props.attributes && props.attributes.key,
      key = isKeyAttr ? props.attributes.key : attrs.key;

   // выпрямляем массив детей, чтобы не было вложенных массивов (они образуются из-за for)
   children = flatten(children, true);

   return Vdom.htmlNode(tagName, props, children, key, function (node) {
      if (node) {
         if (this.control && this.attrs && this.attrs.name) {
            /*
            * Если мы в слое совместимости, то имя компонента, которое передали сверху
            * попадает в атрибуты и записывается в _children
            * и так вышло, что это имя используется внутри контрола
            * После синхронизации корневой элемент в шаблоне
            * перетирает нужного нам ребенка
            * */
            if (this.control._options.name === this.attrs.name && node.tagName === 'DIV' &&
               this.control.hasCompatible && this.control.hasCompatible()) {
               this.attrs.name += '_fix';
            }
            this.control._children[this.attrs.name] = node;
         }
         if (this.attrs) {
            GeneratorVdom.cutFocusAttributes(this.attrs, function (attrName, attrValue) {
               node[attrName] = attrValue;
            }, node);
         }
      }
   }.bind({ control: control, attrs: props.attributes }));
};

GeneratorVdom.createText = function createText(text, key) {
   if (!text)
      return undefined;
   return Vdom.textNode(text, key);
};

GeneratorVdom.createDirective = function createDirective(text) {
   throw new Error('vdomMarkupGenerator createDirective not realized');
};

GeneratorVdom.getScope = function (data) {
   try {
      throw new Error('vdomMarkupGenerator: using scope="{{...}}"');
   } catch (e) {
      IoC.resolve('ILogger').info('SCOPE ... in VDom', e.stack);
   }
   return data;
};

GeneratorVdom.canBeCompatible = false;

GeneratorVdom.escape = function (value) {
   return value;
};

export default GeneratorVdom;
