/// <amd-module name="UI/_base/HTML" />
define('UI/_base/HTML', [
    'require',
    'exports',
    'tslib',
    'UI/_base/Control',
    'wml!UI/_base/HTML/HTML',
    'Core/constants',
    'Core/Themes/ThemesController',
    'Core/LinkResolver/LinkResolver',
    'View/Request',
    'UI/_base/Deprecated/AppData'
], function (require, exports, tslib_1, Control_1, template, constants, ThemesController, LinkResolver, Request, AppData_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var HTML = /** @class */
    function (_super) {
        tslib_1.__extends(HTML, _super);
        function HTML() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._template = template;
            _this.onServer = false;
            _this.isCompatible = false;
            _this.compat = false;
            _this.RUMEnabled = false;
            _this.pageName = '';
            _this.title = '';
            _this.templateConfig = null;
            _this.buildnumber = '';
            _this.appRoot = '';
            _this.staticDomains = '[]';
            _this.wsRoot = '';
            _this.resourceRoot = '';
            _this.servicesPath = '';
            _this.application = '';
            _this.product = '';
            _this.linkResolver = null;
            return _this;
        }
        HTML.contextTypes = function () {
            return { AppData: AppData_1.default };
        };
        HTML.prototype.initState = function (cfg) {
            this.title = cfg.title;
            this.templateConfig = cfg.templateConfig;
            this.compat = cfg.compat || false;
        };
        HTML.prototype._beforeMount = function (cfg, context, receivedState) {
            var _this = this;
            this.onServer = typeof window === 'undefined';
            this.isCompatible = cfg.compat;
            this.initState(receivedState || cfg);
            if (!receivedState) {
                receivedState = {};
            }
            this.buildnumber = cfg.buildnumber || constants.buildnumber;
            this.appRoot = cfg.appRoot || context.AppData.appRoot || (cfg.builder ? '/' : constants.appRoot);
            this.RUMEnabled = cfg.RUMEnabled || context.AppData.RUMEnabled || false;
            this.pageName = cfg.pageName || context.AppData.pageName || false;
            this.staticDomains = cfg.staticDomains || context.AppData.staticDomains || constants.staticDomains || '[]';
            if (typeof this.staticDomains !== 'string') {
                this.staticDomains = '[]';
            }
            this.wsRoot = cfg.wsRoot || constants.wsRoot;
            this.resourceRoot = cfg.resourceRoot || constants.resourceRoot;
            this.product = cfg.product || constants.product;    // TODO нужно удалить после решения https://online.sbis.ru/opendoc.html?guid=a9ceff55-1c8b-4238-90a7-22dde0e1bdbe
            // TODO нужно удалить после решения https://online.sbis.ru/opendoc.html?guid=a9ceff55-1c8b-4238-90a7-22dde0e1bdbe
            this.servicesPath = (context.AppData ? context.AppData.servicesPath : cfg.servicesPath) || constants.defaultServiceUrl || '/service/';
            this.application = context.AppData.application;
            if (typeof window === 'undefined' && cfg.theme !== 'default') {
                ThemesController.getInstance().themes = {};
                ThemesController.getInstance().setTheme(cfg.theme);
            }
            var headData = Request.getCurrent().getStorage('HeadData');
            this.linkResolver = new LinkResolver(headData.isDebug, this.buildnumber, this.wsRoot, this.appRoot, this.resourceRoot);    // LinkResolver.getInstance().init(context.headData.isDebug, self.buildnumber, self.appRoot, self.resourceRoot);
            // LinkResolver.getInstance().init(context.headData.isDebug, self.buildnumber, self.appRoot, self.resourceRoot);
            headData.pushDepComponent(this.application, false);    // Временно положим это в HeadData, потом это переедет в константы реквеста
            // Временно положим это в HeadData, потом это переедет в константы реквеста
            headData.isNewEnvironment = !this.isCompatible;
            if (receivedState.csses && !headData.isDebug) {
                ThemesController.getInstance().initCss({
                    themedCss: receivedState.csses.themedCss,
                    simpleCss: receivedState.csses.simpleCss
                });
            }    /**
             * Этот перфоманс нужен, для сохранения состояния с сервера, то есть, cfg - это конфиг, который нам прийдет из файла
             * роутинга и с ним же надо восстанавливаться на клиенте.
             */
            /**
             * Этот перфоманс нужен, для сохранения состояния с сервера, то есть, cfg - это конфиг, который нам прийдет из файла
             * роутинга и с ним же надо восстанавливаться на клиенте.
             */
            return new Promise(function (resolve) {
                resolve({
                    buildnumber: _this.buildnumber,
                    csses: ThemesController.getInstance().getCss(),
                    title: _this.title,
                    appRoot: _this.appRoot,
                    staticDomains: _this.staticDomains,
                    RUMEnabled: _this.RUMEnabled,
                    pageName: _this.pageName,
                    wsRoot: _this.wsRoot,
                    resourceRoot: _this.resourceRoot,
                    templateConfig: _this.templateConfig,
                    servicesPath: _this.servicesPath,
                    compat: _this.compat,
                    product: _this.product
                });
            });
        };
        return HTML;
    }(Control_1.default);
    exports.default = HTML;
});