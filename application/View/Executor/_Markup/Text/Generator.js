/// <amd-module name="View/Executor/_Markup/Text/Generator" />
define('View/Executor/_Markup/Text/Generator', [
    'require',
    'exports',
    'Core/helpers/Number/randomId',
    'Core/helpers/Hcontrol/configStorage',
    'Core/IoC',
    'Core/constants',
    'Core/Serializer',
    'Core/library',
    'View/Logger',
    'View/Request',
    'View/Executor/_Markup/Generator',
    'View/Executor/Expressions',
    'View/Executor/Utils',
    'View/Executor/_Markup/Text/FunctionHeaderTemplate'
], function (require, exports, randomId, configStorage, IoC, cConstants, Serializer, library, Logger, Request, Generator_1, Expressions_1, Utils_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var GeneratorText = Object.create(Generator_1.default);
    var voidElements = [
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
    function resolveControlName(controlData, attributes) {
        var attr = attributes || {};
        if (controlData && controlData.name) {
            attr.name = controlData.name;
        } else {
            if (attributes && attributes.name) {
                controlData.name = attributes.name;
            }
        }
        return attr;
    }
    function getDepsFromSerializer(slr) {
        var moduleInfo;
        var deps = [];
        var modules = slr._linksStorage;
        var parts;
        for (var key in modules) {
            if (modules.hasOwnProperty(key)) {
                moduleInfo = modules[key];
                if (moduleInfo.module) {
                    parts = library.parse(moduleInfo.module);
                    deps.push(parts.name);
                }
            }
        }
        return deps;
    }
    function buildForNewControl(scope, cnstr, decOptions) {
        var _options = scope.user;
        var dfd, result;
        _options['class'] = decOptions['class'];
        var eventsList = Expressions_1.Subscriber.getEventsListFromOptions(_options);
        for (var key in eventsList) {
            if (eventsList.hasOwnProperty(key)) {
                delete _options[key];
            }
        }    // не регаем тут контрол в паренте, потому что этот контрол нужен только для построения верстки, реальный контрол создастся при первой же синхронизации
        // не регаем тут контрол в паренте, потому что этот контрол нужен только для построения верстки, реальный контрол создастся при первой же синхронизации
        var doNotSetParent = _options.doNotSetParent;
        _options.doNotSetParent = true;
        var parentName = _options._logicParent && _options._logicParent._moduleName || '';
        Utils_1.OptionsResolver.resolveOptions(cnstr, _options, parentName);
        var inst = new cnstr(_options), actualOptions = _options;
        actualOptions.doNotSetParent = doNotSetParent;    /**
         * TODO: удалить это. По идее, VDOM контролы не должны генерировть строку если они в window
         */
        /**
         * TODO: удалить это. По идее, VDOM контролы не должны генерировть строку если они в window
         */
        if (typeof window !== 'undefined') {
            Expressions_1.Subscriber.subscribeEvents(inst, scope.internal.logicParent, eventsList);
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
            try {
                dfd = inst._beforeMountLimited && inst._beforeMountLimited(actualOptions, scope.templateContext || {});
            } catch (error) {
                Logger.catchLifeCircleErrors('_beforeMount', error);
            }    //TODO пропустить через contextResolver(где взять класс?)
            //TODO пропустить через contextResolver(где взять класс?)
            inst.saveInheritOptions(scope.inheritOptions || {});    /**
             * Понимаем асинхронная ветка или нет
             */
            /**
             * Понимаем асинхронная ветка или нет
             */
            if (dfd && isInstOfPromise(dfd)) {
                return new Promise(function (resolve) {
                    dfd.then(function (receivedState) {
                        inst._saveContextObject(Expressions_1.ContextResolver.resolveContext(cnstr, scope.templateContext || {}));
                        inst.saveFullContext(Expressions_1.ContextResolver.wrapContext(inst, scope.templateContext || {}));
                        var request = Request.getCurrent();
                        if (request) {
                            request.stateReceiver.register(scope.key, {
                                getState: function () {
                                    return receivedState;
                                },
                                setState: function () {
                                }
                            });
                        }
                        result = inst._template ? inst.render(null, decOptions) : '';
                        if (result.then) {
                            result.then(function (res) {
                                resolve({
                                    result: res,
                                    receivedState: receivedState
                                });
                            }, function (err) {
                                Utils_1.Common.asyncRenderErrorLog(err);
                                resolve({
                                    result: asyncRenderErrorTag(inst),
                                    receivedState: undefined
                                });
                            });
                        } else {
                            resolve({
                                result: result,
                                receivedState: receivedState
                            });
                        }
                    }, function (err) {
                        Utils_1.Common.asyncRenderErrorLog(err);
                        resolve({
                            result: asyncRenderErrorTag(inst),
                            receivedState: undefined
                        });
                    });
                });
            } else {
                inst._saveContextObject(Expressions_1.ContextResolver.resolveContext(cnstr, scope.templateContext || {}));
                inst.saveFullContext(Expressions_1.ContextResolver.wrapContext(inst, scope.templateContext || {}));
            }
        }
        result = inst._template ? inst.render(undefined, decOptions) : '';
        return result;
    }
    function buildMarkupForClass(cnstr, scope, context, varStorage, decOptions) {
        var _options = scope.user, result;
        decOptions = resolveControlName(_options, decOptions);
        result = buildForNewControl({
            user: _options,
            internal: scope.internal,
            templateContext: scope.templateContext,
            inheritOptions: scope.inheritOptions,
            key: scope.key
        }, cnstr, decOptions);
        return result;
    }    /**
     * Если существует другой разрешатель имен в config.js. Мы его найдем и используем для подключения.
     * @param tpl
     * @param includedTemplates
     * @param _deps
     * @param config
     * @returns {*}
     */
    /**
     * Если существует другой разрешатель имен в config.js. Мы его найдем и используем для подключения.
     * @param tpl
     * @param includedTemplates
     * @param _deps
     * @param config
     * @returns {*}
     */
    function stringTemplateResolver(tpl, includedTemplates, _deps, config) {
        var resolver = config && config.resolvers ? Utils_1.Common.findResolverInConfig(tpl, config.resolvers) : undefined;
        if (resolver) {
            return resolver(tpl);
        } else {
            return Utils_1.Common.depsTemplateResolver(tpl, includedTemplates, _deps, config);
        }
    }    /**
     * Создаем строку с тегом для повторного выполнения
     * _beforeMount на клиенте и обработки ошибок
     * @param inst
     * @returns {string}
     */
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
            decoratorObject = Expressions_1.Decorate.createRootDecoratorObject(options['__$config'], true, options['data-component'], {});
        }
        return GeneratorText.createTag('div', { attributes: decoratorObject }, []);
    }
    function decorateAttrs(attr1, attr2) {
        function wrapUndef(value) {
            if (value === undefined || value === null) {
                return '';
            } else {
                return value;
            }
        }
        var attrToStr = function (attrs) {
            var str = '';
            for (var attr in attrs) {
                if (attrs.hasOwnProperty(attr)) {
                    str += wrapUndef(attrs[attr]) !== '' ? ' ' + (attr + '="' + attrs[attr] + '"') : '';
                }
            }
            return str;
        };
        return attrToStr(GeneratorText.joinAttrs(attr1, attr2));
    }
    GeneratorText.createController = function () {
        /**
         * В VDom идеологии контроллер - это пустая текстовая нода. И она имеет смысл только в VDom
         * Получается, для экономии ресурсов нам не надо вызвать конструктор компонента здесь,
         * ведь результат все равно никак не сохранить
         * Нужно ли здесь вызывать beforeMount? Такой задачи не известно, ведь обращаться к данным,
         * которые может вернуть контрол в beforeMount может только он сам.
         * А если он не визуальный, зачем тогда ему какие-то данные проксировать через текстовый вид?
         */
        return '';
    };
    GeneratorText.createEmptyText = function () {
        return '';
    };
    GeneratorText.createWsControl = function createWsControl(tpl, scope, attributes, context, _deps) {
        var data = this.prepareDataForCreate(tpl, scope, attributes, _deps);
        var dataComponent = data.dataComponent;
        Logger.log('createWsControl', [
            dataComponent,
            data.controlProperties
        ]);
        Logger.log('Context for control', [
            '',
            attributes.context
        ]);
        Logger.log('Inherit options for control', [
            '',
            attributes.inheritOptions
        ]);
        var varStorage = null, cnstr = data.controlClass, resultingFn = cnstr && cnstr.prototype._template;
        if (!cnstr && !resultingFn) {
            return '';
        }
        if (cnstr && !resultingFn) {
            return GeneratorText.createController(cnstr, scope, attributes, context, _deps);
        }
        var _options = data.controlProperties;
        if (!_options['data-component']) {
            _options['data-component'] = dataComponent;
        }    /**
         * Опции для dirtyChecking будем прокидывать только в VDOM
         */
        /**
         * Опции для dirtyChecking будем прокидывать только в VDOM
         */
        for (var di = 0; _options.hasOwnProperty('__dirtyCheckingVars_' + di); di++) {
            delete _options['__dirtyCheckingVars_' + di];
        }
        return buildMarkupForClass(cnstr, {
            user: _options,
            internal: data.internal,
            templateContext: attributes.context,
            inheritOptions: attributes.inheritOptions,
            key: attributes.key
        }, context, varStorage, attributes);
    };
    GeneratorText.createTemplate = function createTemplate(name, scope, attributes, context, _deps, config) {
        var resultingFn, resolver = Utils_1.Common.hasResolver(name, config && config.resolvers);
        if (Utils_1.Common.isString(name)) {
            if (resolver) {
                resultingFn = config.resolvers[resolver](name);
            } else {
                // @ts-ignore
                resultingFn = _deps && _deps[name] || require(name);
                if (resultingFn && Utils_1.Common.isOptionalString(name) && !Utils_1.Common.isTemplateString(name)) {
                    return this.createWsControl(name.split('js!')[1], scope, attributes, context, _deps);
                }
            }
        } else {
            resultingFn = name;
        }
        var data = this.prepareDataForCreate(name, scope, attributes, _deps);
        var parent = data.parent, resolvedScope = data.controlProperties;
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
        return resultingFn === null ? '' : parent ? resultingFn.call(parent, resolvedScope, attributes, context) : resultingFn(resolvedScope, attributes, context);
    };
    GeneratorText.resolver = function resolver(tpl, preparedScope, decorAttribs, context, _deps, includedTemplates, config, defCollection) {
        var isTplString = typeof tpl === 'string', isTplModule = Utils_1.Common.isLibraryModule(tpl), data = this.prepareDataForCreate(tpl, preparedScope, decorAttribs, _deps, includedTemplates), resolvedScope = data.controlProperties, fn;
        if (isTplString) {
            fn = stringTemplateResolver(tpl, includedTemplates, _deps, config);
        } else if (isTplModule) {
            fn = data.controlClass;
        } else {
            fn = tpl;
        }
        if (Utils_1.Common.isControlClass(fn)) {
            /**
             * Сейчас оживление контролов построено на атрибуте data-component
             * и если вдруг мы туда запишем неправильный moduleName то все упадет
             * Контрол будет создан не от того класса, поэтому для решения проблем такой
             * совместимости пропатчим _moduleName правильным значением
             */
            if (isTplString && tpl.indexOf('js!') !== -1 && !Utils_1.RequireHelper.defined(fn.prototype._moduleName)) {
                fn.prototype._moduleName = tpl.split('js!')[1];
            }
            if (fn.prototype._template) {
                return GeneratorText.createWsControl(fn, preparedScope, decorAttribs, context, _deps);
            }
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
            var r;
            if (typeof fn === 'function') {
                r = preparedScope && data.parent ? fn.call(data.parent, resolvedScope, decorAttribs, context, false) : fn(resolvedScope, decorAttribs, context, false);
            } else if (fn && typeof fn.func === 'function') {
                r = preparedScope && data.parent ? fn.func.call(data.parent, resolvedScope, decorAttribs, context, false) : fn.func(resolvedScope, decorAttribs, context, false);
            } else if (Utils_1.Common.isArray(fn)) {
                r = preparedScope && data.parent ? fn.map(function (template) {
                    if (typeof template === 'function') {
                        return template.call(data.parent, resolvedScope, decorAttribs, context, false);
                    } else if (typeof template.func === 'function') {
                        return template.func.call(data.parent, resolvedScope, decorAttribs, context, false);
                    }
                    return template;
                }) : fn.map(function (template) {
                    if (typeof template === 'function') {
                        return template(resolvedScope, decorAttribs, context, false);
                    } else if (typeof template.func === 'function') {
                        return template.func(resolvedScope, decorAttribs, context, false);
                    }
                    return template;
                });
                r = GeneratorText.joinElements(r, undefined, defCollection);
            } else {
                if (typeof tpl === 'undefined') {
                    IoC.resolve('ILogger').error(typeof tpl + ' component error', 'Попытка использовать компонент/шаблон, ' + 'но вместо компонента в шаблоне был передан ' + typeof tpl + '! ' + 'Если верстка строится неправильно, нужно поставить точку останова и исследовать стек вызовов. ' + 'По стеку будет понятно, в каком шаблоне и в какую опцию передается ' + typeof tpl);
                    return '';
                } else {
                    r = tpl;
                }
            }
            return r;
        }
    };
    GeneratorText.joinElements = function joinElements(elements, key, defCollection) {
        if (Array.isArray(elements)) {
            var res = '';
            elements.forEach(function joinOneElement(element) {
                var id;
                if (Array.isArray(element)) {
                    element = GeneratorText.joinElements(element, undefined, defCollection);
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
                res += element || '';
            });
            return res;
        } else {
            throw new Error('joinElements: elements is not array');
        }
    };    /**
     *
     * @param tag
     * @param attrs Собственные атрибуты
     * @param children
     * @param attr
     * @param defCollection
     * @returns {string}
     */
    /**
     *
     * @param tag
     * @param attrs Собственные атрибуты
     * @param children
     * @param attr
     * @param defCollection
     * @returns {string}
     */
    GeneratorText.createTag = function createTag(tag, attrs, children, attrToDecorate, defCollection) {
        if (!attrToDecorate) {
            attrToDecorate = {};
        }
        if (!attrs) {
            attrs = {};
        }
        var mergedAttrs = Expressions_1.Attr.processMergeAttributes(attrToDecorate.attributes, attrs.attributes, true);
        Expressions_1.Focus.prepareTabindex(mergedAttrs);    // remove focus attributes from object
        // remove focus attributes from object
        GeneratorText.cutFocusAttributes(mergedAttrs);
        var mergedAttrsStr = mergedAttrs ? decorateAttrs(mergedAttrs, {}) : '';
        if (~voidElements.indexOf(tag)) {
            return '<' + tag + mergedAttrsStr + ' />';
        }
        return '<' + tag + mergedAttrsStr + '>' + GeneratorText.joinElements(children, undefined, defCollection) + '</' + tag + '>';
    };
    GeneratorText.createText = function createText(text) {
        return text;
    };
    GeneratorText.createDirective = function createDirective(text) {
        return '<' + text + '>';
    };
    GeneratorText.createComment = function createComment(text) {
        return '<!--' + text + '-->';
    };
    GeneratorText.makeInlineConfigs = function makeInlineConfigs(res, optionsConfig, receivedState) {
        var ser = GeneratorText.serializeReceivedState(receivedState);
        return res + '<script type="text/javascript" data-vdomignore="true">window.inline' + optionsConfig.replace('cfg-', '') + '=\'' + ser + '\';</script>';
    };
    GeneratorText.serializeReceivedState = function serializeReceivedState(receivedState) {
        var slr = new Serializer(), ser = JSON.stringify(receivedState, slr.serialize);    // заменяем опасные символы, коотрые могут привести к синтаксическим ошибкам
        // заменяем опасные символы, коотрые могут привести к синтаксическим ошибкам
        Utils_1.Common.componentOptsReArray.forEach(function (re) {
            ser = ser.replace(re.toFind, re.toReplace);
        });
        return ser;
    };
    GeneratorText.saveConfig = function saveConfig(configId, inst) {
        /**
         * Сохраним инстанс в configStorage
         */
        if (typeof window !== 'undefined') {
            var configObj = {};
            configObj[configId] = inst;
            configStorage.merge(configObj);
        }
    };
    GeneratorText.calculateScope = function calculateScope(scope) {
        return Expressions_1.Scope.calculateScope(scope, Expressions_1.Scope.controlPropMerge);
    };
    GeneratorText.buildMarkupForClass = buildMarkupForClass;
    GeneratorText.escape = Utils_1.Common.escape;    // TODO удалить когда слой совместимости будет не нужен
    // TODO удалить когда слой совместимости будет не нужен
    if (cConstants.isBrowserPlatform && cConstants.compat) {
        // @ts-ignore
        require(['View/Executor/GeneratorCompatible']);    // compatible behavior is initialised in markupGeneratorCompatible
    }
    // compatible behavior is initialised in markupGeneratorCompatible
    exports.default = GeneratorText;
});