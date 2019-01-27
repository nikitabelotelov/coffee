/// <amd-module name="UI/_base/HTML/Head" />
define('UI/_base/HTML/Head', [
    'require',
    'exports',
    'tslib',
    'UI/_base/Control',
    'wml!UI/_base/HTML/Head',
    'View/Request',
    'Core/Themes/ThemesControllerNew'
], function (require, exports, tslib_1, Control_1, template, Request, ThemesControllerNew) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Head = /** @class */
    function (_super) {
        tslib_1.__extends(Head, _super);
        function Head() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._template = template;
            _this.head = null;
            _this.themedCss = [];
            _this.simpleCss = [];
            _this.staticDomainsstringified = '[]';
            return _this;
        }
        Head.prototype._beforeMountLimited = function () {
            // https://online.sbis.ru/opendoc.html?guid=252155de-dc95-402c-967d-7565951d2061
            // This component awaits completion of building content of _Wait component
            // So we don't need timeout of async building in this component
            // Because we need to build depends list in any case
            // before returning html to client
            return this._beforeMount.apply(this, arguments);
        };
        Head.prototype._beforeMount = function (options) {
            var _this = this;
            this._forceUpdate = function () {
            };
            if (typeof options.staticDomains === 'string') {
                this.staticDomainsstringified = options.staticDomains;
            } else if (options.staticDomains instanceof Array) {
                this.staticDomainsstringified = JSON.stringify(options.staticDomains);
            }    /*Этот коммент требует английского рефакторинга
            * Сохраним пользовательские данные на инстанс
            * мы хотим рендерить их только 1 раз, при этом, если мы ренедрим их на сервере мы добавим класс
            * head-custom-block */
            /*Этот коммент требует английского рефакторинга
            * Сохраним пользовательские данные на инстанс
            * мы хотим рендерить их только 1 раз, при этом, если мы ренедрим их на сервере мы добавим класс
            * head-custom-block */
            this.head = options.head;
            if (typeof window !== 'undefined') {
                /*всем элементам в head назначается атрибут data-vdomignore
                * то есть, inferno их не удалит, и если в head есть спец элементы,
                * значит мы рендерились на сервере и здесь сейчас оживаем, а значит пользовательский
                * контент уже на странице и генерировать второй раз не надо, чтобы не было синхронизаций
                * */
                if (document.getElementsByClassName('head-custom-block').length > 0) {
                    this.head = undefined;
                }
                this.themedCss = [];
                this.simpleCss = [];
                return;
            }
            var headData = Request.getCurrent().getStorage('HeadData');
            var def = headData.waitAppContent();
            this.cssLinks = [];
            return new Promise(function (resolve, reject) {
                def.then(function (res) {
                    _this.newSimple = ThemesControllerNew.getInstance().getSimpleCssList();
                    _this.newThemed = ThemesControllerNew.getInstance().getThemedCssList();
                    _this.themedCss = res.css.themedCss;
                    _this.simpleCss = res.css.simpleCss;
                    _this.errorState = res.errorState;
                    resolve();
                });
            });
        };
        Head.prototype._shouldUpdate = function () {
            return false;
        };
        Head.prototype.isArrayHead = function () {
            return Array.isArray(this.head);
        };
        Head.prototype.isMultiThemes = function () {
            return Array.isArray(this._options.theme);
        };
        Head.prototype.getCssWithTheme = function (value, theme) {
            return value.replace('.css', '') + '_' + theme + '.css';
        };
        return Head;
    }(Control_1.default);
    exports.default = Head;
});