/// <amd-module name="UI/_base/HTML/StartApplicationScript" />
define('UI/_base/HTML/StartApplicationScript', [
    'require',
    'exports',
    'tslib',
    'UI/_base/Control',
    'wml!UI/_base/HTML/StartApplicationScript',
    'View/Request'
], function (require, exports, tslib_1, Control_1, template, Request) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var StartApplicationScript = /** @class */
    function (_super) {
        tslib_1.__extends(StartApplicationScript, _super);
        function StartApplicationScript() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._template = template;
            _this.additionalDeps = [];
            return _this;
        }
        StartApplicationScript.prototype._beforeMount = function () {
            var _this = this;
            if (typeof window !== 'undefined') {
                return;
            }
            var def = Request.getCurrent().getStorage('HeadData').waitAppContent();
            return new Promise(function (resolve) {
                def.then(function (res) {
                    _this.additionalDeps = res.additionalDeps;
                    resolve();
                });
            });
        };
        StartApplicationScript.prototype.getDeps = function () {
            if (!this.additionalDeps || !this.additionalDeps.length) {
                return '[]';
            }
            var result = '[ ';
            for (var i = 0; i < this.additionalDeps.length; i++) {
                result += (i === 0 ? '' : ', ') + '"' + this.additionalDeps[i] + '"';
            }
            result += ' ]';
            return result;
        };
        return StartApplicationScript;
    }(Control_1.default);
    exports.default = StartApplicationScript;
});