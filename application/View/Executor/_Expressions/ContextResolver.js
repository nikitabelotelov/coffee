/// <amd-module name="View/Executor/_Expressions/ContextResolver" />
define('View/Executor/_Expressions/ContextResolver', [
    'require',
    'exports',
    'Env/Env',
    'Core/DataContext'
], function (require, exports, Env_1, DataContext) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var whiteList = {
        'UserActivity/ActivityContextField': true,
        'Notes/VDOM/Context': true,
        'Controls/Application/AppData': true,
        'Controls/Container/Scroll/Context': true,
        'Controls/Context/TouchContextField': true,
        'Controls/StickyHeader/Context': true,
        'Controls/Container/Data/ContextOptions': true,
        'Controls/Selector/__ControllerContext': true,
        'Controls/Container/Filter/FilterContextField': true,
        'Controls/Container/Search/SearchContextField': true,
        'Controls/Filter/Button/Panel/Wrapper/_FilterPanelOptions': true,
        'Controls/Container/Suggest/Layout/_SuggestOptionsField': true,
        'WSTests/unit/tmpl/sync-tests/context/contextField': true,
        'WSTests/unit/tmpl/sync-tests/context/updateConsumers/ctxField': true,
        'WSTests/unit/tmpl/sync-tests/context/contextField2': true,
        'WSTests/unit/tmpl/sync-tests/context/dirtyCheckingUpdate/contextField': true
    };
    function compositeGetVersion() {
        var version = 0;
        for (var key in this) {
            if (this.hasOwnProperty(key) && this[key]) {
                if (this[key].getVersion) {
                    version += this[key].getVersion();
                }
            }
        }
        return version;
    }
    function wrapContext(inst, currentCtx) {
        if (inst && inst._getChildContext) {
            currentCtx = Object.create(currentCtx);
            var ctx = inst._getChildContext();
            for (var i in ctx) {
                if (ctx.hasOwnProperty(i)) {
                    // if (!(ctx[i] instanceof DataContext))
                    //    IoC.resolve('ILogger').error(null, 'Context field ' + i + ' === ' + ctx[i] + ' should be instance of Core/DataContext');
                    if (ctx[i] && ctx[i]._moduleName && !whiteList[ctx[i]._moduleName]) {
                        Env_1.IoC.resolve('ILogger').error('Wrong context field', ctx[i]._moduleName + '. In control: ' + inst._moduleName + '. Only allowed context fields: ' + Object.keys(whiteList));
                    }
                    currentCtx[i] = ctx[i];
                    if (ctx[i] && ctx[i].getVersion === DataContext.prototype.getVersion) {
                        for (var j in ctx[i]) {
                            if (ctx[i].hasOwnProperty(j) && ctx[i][j]) {
                                if (ctx[i][j].getVersion) {
                                    ctx[i].getVersion = compositeGetVersion;
                                }
                            }
                        }
                    }
                }
            }
        }
        return currentCtx;
    }
    exports.wrapContext = wrapContext;
    function resolveContext(controlClass, currentContext, control) {
        if (typeof currentContext === 'undefined') {
            //Корневая нода. Не может быть контекста
            return {};
        }
        var contextTypes = controlClass.contextTypes ? controlClass.contextTypes() : {};
        var resolvedContext = {};
        if (!contextTypes) {
            Env_1.IoC.resolve('ILogger').error(null, 'Context types are not defined');
        } else {
            for (var key in contextTypes) {
                if (!(currentContext[key] instanceof contextTypes[key])) {
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
    exports.resolveContext = resolveContext;
});