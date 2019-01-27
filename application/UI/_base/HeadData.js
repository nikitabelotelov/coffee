define('UI/_base/HeadData', [
    'require',
    'exports',
    'Core/Themes/ThemesController',
    'Core/cookie',
    'UI/_base/DepsCollector',
    'View/Request'
], function (require, exports, ThemesController, cookie, DepsCollector_1, Request) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    function cropSlash(str) {
        var res = str;
        res = res.replace(/\/+$/, '');
        res = res.replace(/^\/+/, '');
        return res;
    }
    function joinPaths(arr) {
        var arrRes = [];
        for (var i = 0; i < arr.length; i++) {
            arrRes.push(cropSlash(arr[i]));
        }
        return arrRes.join('/');
    }
    var bundles, modDeps, contents;    // Need these try-catch because:
                                       // 1. We don't need to load these files on client
                                       // 2. We don't have another way to check if these files exists on server
    // Need these try-catch because:
    // 1. We don't need to load these files on client
    // 2. We don't have another way to check if these files exists on server
    try {
        // TODO https://online.sbis.ru/opendoc.html?guid=7e096cc5-d95a-48b9-8b71-2a719bd9886f
        // Need to fix this, to remove hardcoded paths
        modDeps = require('json!resources/module-dependencies');
    } catch (e) {
    }
    try {
        contents = require('json!resources/contents');
    } catch (e) {
    }
    try {
        bundles = require('json!resources/bundlesRoute');
    } catch (e) {
    }
    bundles = bundles || {};
    modDeps = modDeps || {
        links: {},
        nodes: {}
    };
    contents = contents || {};
    var HeadData = /** @class */
    function () {
        function HeadData() {
            var _this = this;
            this.depComponentsMap = {};
            this.additionalDeps = {};
            this.waiterDef = null;
            this.isDebug = false;    // переедет в константы реквеста, изменяется в Controls/Application
            // переедет в константы реквеста, изменяется в Controls/Application
            this.isNewEnvironment = false;
            this.resolve = null;
            this.renderPromise = null;
            this.renderPromise = new Promise(function (resolve) {
                _this.resolve = resolve;
            });
            this.depComponentsMap = {};
            this.additionalDeps = {};
            this.isDebug = cookie.get('s3debug') === 'true' || contents.buildMode === 'debug';
        }    /* toDO: StateRec.register */
        /* toDO: StateRec.register */
        HeadData.prototype.pushDepComponent = function (componentName, needRequire) {
            this.depComponentsMap[componentName] = true;
            if (needRequire) {
                this.additionalDeps[componentName] = true;
            }
        };
        HeadData.prototype.pushWaiterDeferred = function (def) {
            var _this = this;
            var depsCollector = new DepsCollector_1.default(modDeps.links, modDeps.nodes, bundles, true);
            this.waiterDef = def;
            this.waiterDef.then(function () {
                if (!_this.resolve) {
                    return;
                }
                var components = Object.keys(_this.depComponentsMap);
                var files = {};
                if (_this.isDebug) {
                    files = {};
                } else {
                    files = depsCollector.collectDependencies(components);
                    ThemesController.getInstance().initCss({
                        themedCss: files.css.themedCss,
                        simpleCss: files.css.simpleCss
                    });
                }
                var rcsData = Request.getCurrent().stateReceiver.serialize();
                var additionalDepsArray = [];
                for (var key in rcsData.additionalDeps) {
                    if (rcsData.additionalDeps.hasOwnProperty(key)) {
                        additionalDepsArray.push(key);
                    }
                }    // Костыль. Чтобы сериализовать receivedState, нужно собрать зависимости, т.к. в receivedState у компонента
                     // Application сейчас будет список css, для восстановления состояния с сервера.
                     // Но собирать зависимости нам нужно после receivedState, потому что в нем могут тоже могут быть зависимости
                // Костыль. Чтобы сериализовать receivedState, нужно собрать зависимости, т.к. в receivedState у компонента
                // Application сейчас будет список css, для восстановления состояния с сервера.
                // Но собирать зависимости нам нужно после receivedState, потому что в нем могут тоже могут быть зависимости
                var additionalDeps = depsCollector.collectDependencies(additionalDepsArray);
                files.js = files.js || [];
                if (!_this.isDebug) {
                    for (var i = 0; i < additionalDeps.js.length; i++) {
                        if (!~files.js.indexOf(additionalDeps.js[i])) {
                            files.js.push(additionalDeps.js[i]);
                        }
                    }
                }
                _this.resolve({
                    js: files.js || [],
                    tmpl: files.tmpl || [],
                    css: files.css || {
                        themedCss: [],
                        simpleCss: []
                    },
                    errorState: _this.err,
                    receivedStateArr: rcsData.serialized,
                    additionalDeps: Object.keys(rcsData.additionalDeps).concat(Object.keys(_this.additionalDeps))
                });
                _this.resolve = null;
            });
        };
        HeadData.prototype.waitAppContent = function () {
            return this.renderPromise;
        };
        HeadData.prototype.resetRenderDeferred = function () {
            var _this = this;
            this.renderPromise = new Promise(function (resolve) {
                _this.resolve = resolve;
            });
        };
        return HeadData;
    }();
    exports.default = HeadData;
});