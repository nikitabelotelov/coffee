/// <amd-module name="View/Executor/_Utils/Compatible" />
define('View/Executor/_Utils/Compatible', [
    'require',
    'exports',
    'Core/helpers/Function/shallowClone',
    'Core/IoC',
    'Core/constants',
    'View/Logger',
    'View/Executor/_Utils/OptionsResolver',
    'View/Executor/Expressions'
], function (require, exports, shallowClone, IoC, constants, Logger, OptionsResolver_1, Expressions_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Создает объект с объединенными (прикладными и служебными опциями)
     * @param {Object} userOptions Прикладные опции
     * @param {Object} internalOptions Служебные опции
     * @returns {Object} Объединенные опции
     */
    /**
     * Создает объект с объединенными (прикладными и служебными опциями)
     * @param {Object} userOptions Прикладные опции
     * @param {Object} internalOptions Служебные опции
     * @returns {Object} Объединенные опции
     */
    function createCombinedOptions(userOptions, internalOptions) {
        var i, res = shallowClone(userOptions);
        for (i in internalOptions) {
            // не включаем переменные dirty-checking'а в объединенные опции
            if (internalOptions.hasOwnProperty(i) && i.toString().indexOf('__dirtyCheckingVars_') === -1) {
                res[i] = internalOptions[i];
            }
        }
        return res;
    }
    exports.createCombinedOptions = createCombinedOptions;    /**
     * Объединяет прикладные и служебные опции компонента, если это необходимо.
     * (Например для compound-контрола)
     * @param module Модуль контрола
     * @param userOptions Прикладные опции
     * @param internalOptions Служебные опции
     * @returns {*} Правильные опции компонента
     */
    /**
     * Объединяет прикладные и служебные опции компонента, если это необходимо.
     * (Например для compound-контрола)
     * @param module Модуль контрола
     * @param userOptions Прикладные опции
     * @param internalOptions Служебные опции
     * @returns {*} Правильные опции компонента
     */
    function combineOptionsIfCompatible(module, userOptions, internalOptions) {
        var res;
        if (module.$constructor) {
            res = createCombinedOptions(userOptions, internalOptions);
        } else if (internalOptions && internalOptions.logicParent) {
            //Если нет $constructor и есть логический родитель, значит vdom внутри vdom
            res = userOptions;
            res._logicParent = internalOptions.logicParent;
            res._isSeparatedOptions = true;
        } else {
            // Добавляем флаг о том, что опции были разделены (необходимо для правильной
            // инициализации внутри BaseCompatible
            res = createCombinedOptions(userOptions, { _isSeparatedOptions: true });
        }
        return res;
    }
    exports.combineOptionsIfCompatible = combineOptionsIfCompatible;    /**
     * Создает инстанс компонента, учитывая возможную необходимость объединения опций (compatible, compound)
     * @param cnstr Конструктор компонента
     * @param {Object} userOptions Прикладные опции
     * @param {Object} internalOptions Служебные опции
     */
    /**
     * Создает инстанс компонента, учитывая возможную необходимость объединения опций (compatible, compound)
     * @param cnstr Конструктор компонента
     * @param {Object} userOptions Прикладные опции
     * @param {Object} internalOptions Служебные опции
     */
    function createInstanceCompatible(cnstr, userOptions, internalOptions) {
        internalOptions = internalOptions || {};
        var actualOptions = combineOptionsIfCompatible(cnstr.prototype, userOptions, internalOptions), inst, restoreOptions, coreControl, parentName = internalOptions.logicParent && internalOptions.logicParent._moduleName;
        var defaultOpts = OptionsResolver_1.getDefaultOptions(cnstr);
        OptionsResolver_1.resolveOptions(cnstr, defaultOpts, actualOptions, parentName);
        if (internalOptions.parent && internalOptions.parent._options && internalOptions.parent._options.iWantBeWS3) {
            actualOptions.iWantBeWS3 = true;
        }
        try {
            inst = new cnstr(actualOptions);
        } catch (error) {
            // @ts-ignore
            coreControl = require('Core/Control');
            inst = new coreControl({ iWantBeWS3: actualOptions.iWantBeWS3 });
            Logger.catchLifeCircleErrors('constructor', error);
        }
        if (actualOptions.mustCompatible || actualOptions.iWantBeWS3) {
            try {
                var makeInstanceCompatible = require('Core/helpers/Hcontrol/makeInstanceCompatible');
                makeInstanceCompatible(inst);
            } catch (e) {
                IoC.resolve('ILogger').error('WS3WS4', 'Please require Core/helpers/Hcontrol/makeInstanceCompatible manual');
            }
        }    /*Здесь родитель может быть CompoundControl*/
        /*Здесь родитель может быть CompoundControl*/
        if (internalOptions.logicParent && internalOptions.logicParent._children && userOptions.name) {
            internalOptions.logicParent._children[userOptions.name] = inst;
        }    // Возвращаем опции назад, т.к. нужно еще с ними взаимодействовать
        // Возвращаем опции назад, т.к. нужно еще с ними взаимодействовать
        if (inst.isCompatibleLayout && !inst.isCompatibleLayout() && inst.iWantVDOM !== false) {
            restoreOptions = inst._options;
            if (inst._savedOptions) {
                inst._options = inst._savedOptions;
            } else {
                inst._options = actualOptions;
            }
        } else {
            //Если вдруг опции не установлены - надо туда установить объект, чтобы в логах было что-то человекопонятное
            if (!inst._options) {
                inst._options = actualOptions;
            }
        }
        if (constants.compat) {
            inst._setInternalOptions(internalOptions);
        }    // Убираем опции, т.к. они должны отсутствовать _beforeUpdate
        // Убираем опции, т.к. они должны отсутствовать _beforeUpdate
        if (inst.isCompatibleLayout && !inst.isCompatibleLayout() && inst.iWantVDOM !== false) {
            inst._savedOptions = inst._options;
            inst._options = restoreOptions;
        } else if (inst._dotTplFn || inst.iWantVDOM === false) {
            actualOptions = inst._options;
        }
        return {
            instance: inst,
            resolvedOptions: actualOptions,
            defaultOptions: defaultOpts
        };
    }
    exports.createInstanceCompatible = createInstanceCompatible;    /**
     * Создает виртуальную ноду для compound контрола
     * @param controlClass Класс compound-контрола
     * @param controlCnstr Конструктор compound-контрола
     * @param childrenNodes Массив вложеных в контрол virtual-нод
     * @param userOptions Прикладные опции
     * @param internalOptions Служебные опции
     * @param key Ключ
     * @param parentNode Родительская нода
     * @param virtualNode
     * @param markupGenerator Генератор верстки компонента
     * @returns {Object} Возвращает виртуальную ноду
     */
    /**
     * Создает виртуальную ноду для compound контрола
     * @param controlClass Класс compound-контрола
     * @param controlCnstr Конструктор compound-контрола
     * @param childrenNodes Массив вложеных в контрол virtual-нод
     * @param userOptions Прикладные опции
     * @param internalOptions Служебные опции
     * @param key Ключ
     * @param parentNode Родительская нода
     * @param virtualNode
     * @param markupGenerator Генератор верстки компонента
     * @returns {Object} Возвращает виртуальную ноду
     */
    function createCompoundControlNode(controlClass, controlCnstr, childrenNodes, userOptions, internalOptions, key, parentNode, virtualNode, markupGenerator) {
        var _deps = {}, moduleName = controlClass.prototype && controlClass.prototype._moduleName, markup;    // Compound-контрол для работы с vdom держит у себя информацию о своей vdom-ноде
        // Compound-контрол для работы с vdom держит у себя информацию о своей vdom-ноде
        userOptions.__vdomOptions = { controlNode: virtualNode };
        _deps[moduleName] = controlClass;    // добавляем компонент в объект зависимостей и строим верстку компонента
        // добавляем компонент в объект зависимостей и строим верстку компонента
        markup = markupGenerator.createWsControl('ws:' + moduleName, userOptions, {
            internal: virtualNode.controlInternalProperties,
            attributes: virtualNode.controlAttributes,
            events: virtualNode.controlEvents,
            key: virtualNode.key,
            context: virtualNode.context,
            inheritOptions: virtualNode.inheritOptions
        }, undefined, _deps);
        if (!markup) {
            markup = '<span>Component ' + moduleName + ' was building error</span>';
        }
        if (!constants.compat) {
            IoC.resolve('ILogger').error('Building component', 'CompoundControl detected. Component name = ' + moduleName);
        }    // markup contains raw html string because of compatibility. VDOM will insert it as is.
        // markup contains raw html string because of compatibility. VDOM will insert it as is.
        var markupNode = new Expressions_1.RawMarkupNode(markup, virtualNode.controlAttributes, moduleName, virtualNode.key);
        return {
            control: controlClass,
            controlClass: controlCnstr,
            options: createCombinedOptions(userOptions, internalOptions),
            id: undefined,
            parent: parentNode,
            key: key,
            element: undefined,
            markup: markupNode,
            fullMarkup: markupNode,
            childrenNodes: childrenNodes,
            compound: true
        };
    }
    exports.createCompoundControlNode = createCompoundControlNode;
});