/// <amd-module name="View/Executor/_Utils/Vdom" />
define('View/Executor/_Utils/Vdom', [
    'require',
    'exports',
    'View/Request',
    'View/Logger',
    'Inferno/third-party/index.min',
    'View/Executor/Expressions',
    'View/Executor/_Utils/OptionsResolver',
    'View/Executor/_Utils/Common',
    'Inferno/third-party/hydrate.min'
], function (require, exports, Request, Logger, Inferno, Expressions_1, OptionsResolver_1, Common_1, Hydrate) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var receivedName = '', configName = 'cfg-';    /**
     * Для того чтобы всегда брать верхний компонент из конфига
     * @param configId
     * @returns {*}
     */
    /**
     * Для того чтобы всегда брать верхний компонент из конфига
     * @param configId
     * @returns {*}
     */
    function findTopConfig(configId) {
        return (configId + '').replace(configName, '').split(',')[0];
    }
    function fillCtx(control, vnode, resolvedCtx) {
        control._saveContextObject(resolvedCtx);
        control.saveFullContext(Expressions_1.ContextResolver.wrapContext(control, vnode.context || {}));
    }    /**
     * Для того что бы звать сам метод, если он есть или с готовым состоянием
     * @param stateVar
     * @param control
     * @param vnode
     * @param serializer
     * @returns {*}
     */
    /**
     * Для того что бы звать сам метод, если он есть или с готовым состоянием
     * @param stateVar
     * @param control
     * @param vnode
     * @param serializer
     * @returns {*}
     */
    function getStateReadyOrCall(stateVar, control, vnode, serializer) {
        var data, srec = Request.getCurrent().stateReceiver;
        if (srec && srec.register) {
            srec.register(stateVar, {
                setState: function (rState) {
                    data = rState;
                },
                getState: function () {
                    return {};
                }
            });
        }    /* Compat layer. For page without Controls.Application */
        /* Compat layer. For page without Controls.Application */
        if (!data && window['inline' + stateVar]) {
            data = JSON.parse(window['inline' + stateVar], serializer.deserialize);
            if (window['inline' + stateVar]) {
                window['inline' + stateVar] = undefined;
            }
        }
        var ctx = Expressions_1.ContextResolver.resolveContext(control.constructor, vnode.context || {}, control), res;
        try {
            res = data ? control._beforeMountLimited(vnode.controlProperties, ctx, data) : control._beforeMountLimited(vnode.controlProperties, ctx);
        } catch (error) {
            Logger.catchLifeCircleErrors('_beforeMount', error);
        }
        if (res && res.then) {
            res.then(function (resultDef) {
                fillCtx(control, vnode, ctx);
                return resultDef;
            });
        } else {
            fillCtx(control, vnode, ctx);
        }
        if (!vnode.inheritOptions) {
            vnode.inheritOptions = {};
        }
        OptionsResolver_1.resolveInheritOptions(vnode.controlClass, vnode, vnode.controlProperties);
        control.saveInheritOptions(vnode.inheritOptions);
        if (srec && srec.unregister) {
            srec.unregister(stateVar);
        }
        return res;
    }
    function htmlNode(tagName, props, children, key, ref) {
        var vnode = Inferno.createVNode(getFlagsForElementVnode(tagName), tagName, props && props.attributes && props.attributes.class || '', children, children && children.length ? key ? 8 : 4 : 0, props.attributes, key, ref);
        vnode.hprops = props;
        return vnode;
    }
    exports.htmlNode = htmlNode;
    function textNode(text, key) {
        return Inferno.createTextVNode(text, key);
    }
    exports.textNode = textNode;
    function controlNode(controlClass, controlProperties, key) {
        return {
            controlClass: controlClass,
            controlProperties: controlProperties,
            key: key,
            controlNodeIdx: -1
        };
    }
    exports.controlNode = controlNode;
    function isVNodeType(vnode) {
        return vnode && (!Common_1.isString(vnode.children) && typeof vnode.children !== 'number') && vnode.hasOwnProperty('dom');    // return vnode && typeof vnode === 'object' && vnode.type === 'VirtualNode';
    }
    // return vnode && typeof vnode === 'object' && vnode.type === 'VirtualNode';
    exports.isVNodeType = isVNodeType;
    function isTextNodeType(vnode) {
        return vnode && (Common_1.isString(vnode.children) || typeof vnode.children === 'number') && vnode.hasOwnProperty('dom');    // return vnode && typeof vnode === 'object' && vnode.type === 'VirtualText';
    }
    // return vnode && typeof vnode === 'object' && vnode.type === 'VirtualText';
    exports.isTextNodeType = isTextNodeType;
    function isControlVNodeType(vnode) {
        return vnode && typeof vnode === 'object' && 'controlClass' in vnode;
    }
    exports.isControlVNodeType = isControlVNodeType;
    function isTemplateVNodeType(vnode) {
        return vnode && typeof vnode === 'object' && vnode.type === 'TemplateNode';
    }
    exports.isTemplateVNodeType = isTemplateVNodeType;    /**
     * Получаем state из сгенерированного script
     * @param controlNode
     * @param vnode
     * @param Slr
     * @returns {*}
     */
    /**
     * Получаем state из сгенерированного script
     * @param controlNode
     * @param vnode
     * @param Slr
     * @returns {*}
     */
    function getReceivedState(controlNode, vnode, srlz) {
        var control = controlNode.control, rstate = controlNode.key ? findTopConfig(controlNode.key) : '';
        if (control._beforeMountLimited) {
            return getStateReadyOrCall(rstate, control, vnode, srlz);
        }
    }
    exports.getReceivedState = getReceivedState;
    function getFlagsForElementVnode() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return Inferno.getFlagsForElementVnode.apply(Inferno, [].slice.call(arguments));
    }
    exports.getFlagsForElementVnode = getFlagsForElementVnode;
    function patch() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return Inferno.patch.apply(Inferno, [].slice.call(arguments));
    }
    exports.patch = patch;
    function render() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return Inferno.render.apply(Inferno, [].slice.call(arguments));
    }
    exports.render = render;
    function createRenderer() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return Inferno.createRenderer.apply(Inferno, [].slice.call(arguments));
    }
    exports.createRenderer = createRenderer;
    function hydrate() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return Hydrate.hydrate.apply(Hydrate, [].slice.call(arguments));
    }
    exports.hydrate = hydrate;
});