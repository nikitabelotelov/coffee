/// <amd-module name="UI/_base/Document" />
define('UI/_base/Document', [
    'require',
    'exports',
    'tslib',
    'UI/_base/Control',
    'wml!UI/_base/Document/Document',
    'Core/Themes/ThemesController',
    'UI/_base/HeadData',
    'UI/_base/StateReceiver',
    'UI/_base/Deprecated/AppData',
    'View/Request',
    'View/_Request/createDefault'
], function (require, exports, tslib_1, Control_1, template, ThemesController, HeadData_1, StateReceiver_1, AppData_1, Request, createDefault_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Document = /** @class */
    function (_super) {
        tslib_1.__extends(Document, _super);
        function Document(cfg) {
            var _this = _super.call(this, cfg) || this;
            _this._template = template;
            _this.ctxData = null;
            _this.application = '';
            _this.applicationForChange = '';
            _this.coreTheme = '';
            if (typeof window === 'undefined') {
                //need create request for SSR
                //on client request will create in app-init.js
                var req = new Request(createDefault_1.default(Request));
                req.setStateReceiver(new StateReceiver_1.default());
                if (typeof window !== 'undefined' && window.receivedStates) {
                    req.stateReceiver.deserialize(window.receivedStates);
                }
                Request.setCurrent(req);
            }
            var headData = new HeadData_1.default();
            Request.getCurrent().setStorage('HeadData', headData);
            _this.ctxData = new AppData_1.default(cfg);
            return _this;
        }
        Document.prototype._beforeMount = function (cfg) {
            this.application = cfg.application;
        };
        Document.prototype._beforeUpdate = function (cfg) {
            if (this.applicationForChange) {
                this.application = this.applicationForChange;
                this.applicationForChange = null;
            } else {
                this.application = cfg.application;
            }
        };
        Document.prototype._getChildContext = function () {
            return { AppData: this.ctxData };
        };
        Document.prototype.setTheme = function (ev, theme) {
            this.coreTheme = theme;
            if (ThemesController.getInstance().setTheme) {
                ThemesController.getInstance().setTheme(theme);
            }
        };
        Document.prototype.changeApplicationHandler = function (e, app) {
            var result;
            if (this.application !== app) {
                this.applicationForChange = app;
                var headData = Request.getCurrent().getStorage('HeadData');
                headData && headData.resetRenderDeferred();
                this._forceUpdate();
                result = true;
            } else {
                result = false;
            }
            return result;
        };
        return Document;
    }(Control_1.default);
    exports.default = Document;
});