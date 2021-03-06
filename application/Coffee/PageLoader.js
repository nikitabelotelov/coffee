/// <amd-module name="Coffee/PageLoader" />
define('Coffee/PageLoader', [
    'require',
    'exports',
    'tslib',
    'Core/Control',
    'wml!Coffee/PageLoader/PageLoader'
], function (require, exports, tslib_1, Control, template) {
    'use strict';
    var PageLoader = /** @class */
    function (_super) {
        tslib_1.__extends(PageLoader, _super);
        function PageLoader() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._template = template;
            _this.pageClassLoaded = null;
            return _this;
        }
        PageLoader.prototype.changePage = function (newPage, base) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                // @ts-ignore
                var basePath = base;
                if (base) {
                    basePath = base + '/';
                }
                require(['Coffee/' + basePath + newPage], function (newPageClass) {
                    _this.pageClassLoaded = newPageClass;
                    resolve(null);
                });
            });
        };
        PageLoader.prototype._beforeMount = function (cfg) {
            return this.changePage(cfg.pageId || cfg.default, cfg.base || '');
        };
        PageLoader.prototype._beforeUpdate = function (newCfg) {
            var _this = this;    // @ts-ignore
            // @ts-ignore
            if (this._options.pageId !== newCfg.pageId) {
                this.changePage(newCfg.pageId || newCfg.default, newCfg.base || '').then(function () {
                    // @ts-ignore
                    _this._forceUpdate();
                });
            }
        };
        return PageLoader;
    }(Control);
    return PageLoader;
});