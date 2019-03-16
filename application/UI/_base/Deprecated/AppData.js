define('UI/_base/Deprecated/AppData', [
    'require',
    'exports',
    'tslib',
    'Core/DataContext'
], function (require, exports, tslib_1, DataContext) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var AppData = /** @class */
    function (_super) {
        tslib_1.__extends(AppData, _super);
        function AppData(cfg) {
            var _this = _super.call(this, cfg) || this;
            _this.jsLinks = [];
            _this.RUMEnabled = false;
            _this.buildnumber = '';
            _this.appRoot = '';
            _this.staticDomains = '[]';
            _this.wsRoot = '';
            _this.resourceRoot = '';
            _this.servicesPath = '';
            _this.application = '';
            _this.product = '';
            _this.pageName = '';
            _this.cssBundles = null;
            _this.appRoot = cfg.appRoot;
            _this.application = cfg.application;
            _this.wsRoot = cfg.wsRoot;
            _this.resourceRoot = cfg.resourceRoot;
            _this.RUMEnabled = cfg.RUMEnabled;
            _this.pageName = cfg.pageName;
            _this.product = cfg.product;
            _this.cssBundles = cfg.cssBundles;
            _this.buildnumber = cfg.buildnumber;
            _this.servicesPath = cfg.servicesPath;
            _this.staticDomains = cfg.staticDomains;
            return _this;
        }
        return AppData;
    }(DataContext);
    exports.default = AppData;
});