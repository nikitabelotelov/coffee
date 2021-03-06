/// <amd-module name="View/Executor/_Markup/Vdom/Generator" />
define('View/Executor/_Markup/Vdom/Generator', [
    'require',
    'exports',
    'Core/helpers/Array/flatten',
    'Env/Env',
    'View/Logger',
    'View/Executor/_Markup/Generator',
    'View/Executor/Expressions',
    'View/Executor/Utils'
], function (require, exports, flatten, Env_1, Logger, Generator_1, Expressions_1, Utils_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * TODO:: Ответственный Шипин
     * Рефакторинг и обложить тестами
     * https://online.sbis.ru/opendoc.html?guid=4d88c2b4-4e44-463f-bf11-7f0f93cc84f1&des=
     * Задача в разработку 01.06.2017 Покрыть основной функционал VDOM шаблонизатора тестами типа вход-выход…
     * @type {Generator}
     */
    /**
     * TODO:: Ответственный Шипин
     * Рефакторинг и обложить тестами
     * https://online.sbis.ru/opendoc.html?guid=4d88c2b4-4e44-463f-bf11-7f0f93cc84f1&des=
     * Задача в разработку 01.06.2017 Покрыть основной функционал VDOM шаблонизатора тестами типа вход-выход…
     * @type {Generator}
     */
    var GeneratorVdom = Object.create(Generator_1.default);
    var keys = [], preffix = '';
    GeneratorVdom.createEmptyText = function (key) {
        return GeneratorVdom.createText('', key);
    };
    GeneratorVdom.createWsControl = function createWsControl(name, scope, attrs, context, deps) {
        var data = this.prepareDataForCreate(name, scope, attrs, deps);
        var controlClass = data.controlClass;
        Logger.log('createWsControl', [
            data.dataComponent,
            data.controlProperties
        ]);
        Logger.log('Context for control', [
            '',
            attrs.context
        ]);
        Logger.log('Inherit options for control', [
            '',
            attrs.inheritOptions
        ]);
        if (!controlClass) {
            return GeneratorVdom.createText('', data.controlProperties && data.controlProperties.__key || attrs.key);
        }
        var compound = data.compound, controlProperties = data.controlProperties;
        return {
            compound: compound,
            invisible: false,
            controlClass: controlClass,
            controlProperties: controlProperties,
            controlInternalProperties: data.internal,
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
        if (Utils_1.Common.isString(name)) {
            // @ts-ignore
            resultingFn = _deps && _deps[name] || require(name);
            if (resultingFn && Utils_1.Common.isOptionalString(name) && !Utils_1.Common.isTemplateString(name)) {
                return this.createWsControl(name.split('js!')[1], scope, attributes, context, _deps);
            }
        } else {
            resultingFn = name;
        }
        var data = this.prepareDataForCreate(name, scope, attributes, _deps);
        Logger.log('createTemplate', [
            Utils_1.Common.isString(name) ? name : 'InlineFunction',
            data.controlProperties,
            resultingFn
        ]);
        Logger.log('Context for template', [
            '',
            attributes.context
        ]);
        Logger.log('Inherit options for template', [
            '',
            attributes.inheritOptions
        ]);    // Здесь можем получить null  в следствии !optional. Поэтому возвращаем ''
        // Здесь можем получить null  в следствии !optional. Поэтому возвращаем ''
        if (resultingFn == null) {
            return '';
        }    //Если мы имеем подшаблоны только для красоты, а не для DirtyChecking тогда мы хотим увеличивать один и тот же итератор
             //в разных шаблонах, а значит они не должны разрываться DirtyCheckingом
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
        var isTplString = typeof tpl === 'string', isTplModule = Utils_1.Common.isLibraryModule(tpl), fn;
        if (isTplString) {
            fn = Utils_1.Common.depsTemplateResolver(tpl, includedTemplates, _deps, config);
        } else {
            fn = data.controlClass;
        }
        if (!fn) {
            if (typeof tpl === 'function') {
                fn = tpl;
            } else if (tpl && typeof tpl.func === 'function') {
                fn = tpl;
            } else if (Utils_1.Common.isArray(tpl)) {
                fn = tpl;
            }
        }
        if (Utils_1.Common.isControlClass(fn)) {
            return GeneratorVdom.createWsControl(fn, resolvedScope, decorAttribs, context, _deps);
        } else {
            Logger.log('Resolver', [
                isTplString ? tpl : 'InlineFunction',
                data.controlProperties,
                fn
            ]);
            Logger.log('Context for template', [
                '',
                decorAttribs.context
            ]);
            Logger.log('Inherit options for template', [
                '',
                decorAttribs.inheritOptions
            ]);
            var parent = data.parent;
            if (typeof fn === 'function') {
                return parent ? fn.call(parent, resolvedScope, decorAttribs, context, true, undefined) : fn(resolvedScope, decorAttribs, context, true);
            } else if (fn && typeof fn.func === 'function') {
                return parent ? fn.func.call(parent, resolvedScope, decorAttribs, context, true, undefined) : fn.func(resolvedScope, decorAttribs, context, true);
            } else if (Utils_1.Common.isArray(fn)) {
                var res = parent ? fn.reduce(function (prev, next) {
                    if (typeof next === 'function') {
                        return prev.concat(next.call(parent, resolvedScope, decorAttribs, context, true));
                    } else if (typeof next.func === 'function') {
                        return prev.concat(next.func.call(parent, resolvedScope, decorAttribs, context, true));
                    }
                    return prev.concat(next);
                }, []) : fn.reduce(function (prev, next) {
                    if (typeof next === 'function') {
                        return prev.concat(next(resolvedScope, decorAttribs, context, true));
                    } else if (typeof next.func === 'function') {
                        return prev.concat(next.func(resolvedScope, decorAttribs, context, true));
                    }
                    return prev.concat(next);
                }, []);
                return res;
            } else if (typeof tpl === 'undefined') {
                Env_1.IoC.resolve('ILogger').error(typeof tpl + ' component error', 'Попытка использовать компонент/шаблон, ' + 'но вместо компонента в шаблоне был передан ' + typeof tpl + '! ' + 'Если верстка строится неправильно, нужно поставить точку останова и исследовать стек вызовов. ' + 'По стеку будет понятно, в каком шаблоне и в какую опцию передается ' + typeof tpl);
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
            preffix = _preffix || '';    /* Partial может вернуть массив, в результате чего могут появиться вложенные массивы.
             Поэтому здесь необходимо выпрямить массив elements */
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
        var mergedAttrs = Expressions_1.Attr.mergeAttrs(attrToDecorate.attributes, attrs.attributes);
        var mergedEvents = Expressions_1.Attr.mergeEvents(attrToDecorate.events, attrs.events);
        Expressions_1.Focus.prepareTabindex(mergedAttrs);    //Убрать внутри обработку event
        //Убрать внутри обработку event
        var props = {
                attributes: mergedAttrs,
                hooks: {},
                events: mergedEvents || {}
            }, isKeyAttr = props.attributes && props.attributes.key, key = isKeyAttr ? props.attributes.key : attrs.key;    // выпрямляем массив детей, чтобы не было вложенных массивов (они образуются из-за for)
        // выпрямляем массив детей, чтобы не было вложенных массивов (они образуются из-за for)
        children = flatten(children, true);
        return Utils_1.Vdom.htmlNode(tagName, props, children, key, function (node) {
            if (node) {
                if (this.control && this.attrs && this.attrs.name) {
                    /*
                    * Если мы в слое совместимости, то имя компонента, которое передали сверху
                    * попадает в атрибуты и записывается в _children
                    * и так вышло, что это имя используется внутри контрола
                    * После синхронизации корневой элемент в шаблоне
                    * перетирает нужного нам ребенка
                    * */
                    if (this.control._options.name === this.attrs.name && node.tagName === 'DIV' && this.control.hasCompatible && this.control.hasCompatible()) {
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
        }.bind({
            control: control,
            attrs: props.attributes
        }));
    };
    GeneratorVdom.createText = function createText(text, key) {
        if (!text)
            return undefined;
        return Utils_1.Vdom.textNode(text, key);
    };
    GeneratorVdom.createDirective = function createDirective(text) {
        throw new Error('vdomMarkupGenerator createDirective not realized');
    };
    GeneratorVdom.getScope = function (data) {
        try {
            throw new Error('vdomMarkupGenerator: using scope="{{...}}"');
        } catch (e) {
            Env_1.IoC.resolve('ILogger').info('SCOPE ... in VDom', e.stack);
        }
        return data;
    };
    GeneratorVdom.canBeCompatible = false;
    GeneratorVdom.escape = function (value) {
        return value;
    };
    exports.default = GeneratorVdom;
});