/// <amd-module name="UI/_base/HTML/JsLinks" />
define('UI/_base/HTML/JsLinks', [
    'require',
    'exports',
    'tslib',
    'UI/_base/Control',
    'wml!UI/_base/HTML/JsLinks',
    'View/Request'
], function (require, exports, tslib_1, Control_1, template, Request) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var JsLinks = /** @class */
    function (_super) {
        tslib_1.__extends(JsLinks, _super);
        function JsLinks() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._template = template;
            _this.js = [];
            _this.tmpl = [];
            _this.wml = [];
            _this.themedCss = [];
            _this.simpleCss = [];
            _this.receivedStateArr = '';
            return _this;
        }
        JsLinks.prototype._beforeMountLimited = function () {
            // https://online.sbis.ru/opendoc.html?guid=252155de-dc95-402c-967d-7565951d2061
            // This component awaits completion of building content of _Wait component
            // So we don't need timeout of async building in this component
            // Because we need to build depends list in any case
            // before returning html to client
            return this._beforeMount.apply(this, arguments);
        };
        JsLinks.prototype._beforeMount = function () {
            var _this = this;
            if (typeof window !== 'undefined') {
                return;
            }
            var headData = Request.getCurrent().getStorage('HeadData');
            var def = headData.waitAppContent();
            return new Promise(function (resolve, reject) {
                def.then(function (res) {
                    _this.js = res.js;
                    _this.tmpl = res.tmpl;
                    _this.wml = res.wml;
                    _this.themedCss = res.css.themedCss;
                    _this.simpleCss = res.css.simpleCss;
                    _this.receivedStateArr = res.receivedStateArr;
                    resolve(true);
                });
            });
        };
        JsLinks.prototype.getCssNameForDefineWithTheme = function (cssLink) {
            return 'theme?' + cssLink;
        };
        JsLinks.prototype.getDefines = function () {
            var result = '';
            if (this.themedCss && this.simpleCss) {
                var i = void 0;
                for (i = 0; i < this.simpleCss.length; i++) {
                    result += 'define("css!' + this.simpleCss[i] + '", "");';
                }
                for (i = 0; i < this.themedCss.length; i++) {
                    result += 'define("css!' + this.getCssNameForDefineWithTheme(this.themedCss[i]) + '", "");';
                }
            }
            return result;
        };
        return JsLinks;
    }(Control_1.default);
    exports.default = JsLinks;
});