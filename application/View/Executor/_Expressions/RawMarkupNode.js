/// <amd-module name="View/Executor/_Expressions/RawMarkupNode" />
define('View/Executor/_Expressions/RawMarkupNode', [
    'require',
    'exports',
    'View/Executor/_Expressions/Focus'
], function (require, exports, FocusHelper) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    // this class need for create instance containing raw html and some properties.
                                                                      // VDOM will insert it as is and generated node will get some properties.
    // this class need for create instance containing raw html and some properties.
    // VDOM will insert it as is and generated node will get some properties.
    var RawMarkupNode = /** @class */
    function () {
        function RawMarkupNode(markup, attributes, moduleName, key) {
            var nodeProperties = {};
            if (attributes.hasOwnProperty('attr:ws-creates-context')) {
                nodeProperties['ws-creates-context'] = attributes['attr:ws-creates-context'];
            }
            if (attributes.hasOwnProperty('attr:ws-delegates-tabfocus')) {
                nodeProperties['ws-delegates-tabfocus'] = attributes['attr:ws-delegates-tabfocus'];
            }
            if (attributes.hasOwnProperty('attr:ws-tab-cycling')) {
                nodeProperties['ws-tab-cycling'] = attributes['attr:ws-tab-cycling'];
            }
            if (attributes.hasOwnProperty('attr:ws-no-focus')) {
                nodeProperties['ws-no-focus'] = attributes['attr:ws-no-focus'];
            }    // todo в resetDefaultValues нужно передать вторым аргументом атрибуты, которые могут перебить дефолтные
            // todo в resetDefaultValues нужно передать вторым аргументом атрибуты, которые могут перебить дефолтные
            FocusHelper.resetDefaultValues(nodeProperties);
            this.markup = markup;
            this.dom = null;
            this.key = key;
            this.nodeProperties = nodeProperties;    //this.type = {name: moduleName.replace(/\//ig,'.')};
        }
        //this.type = {name: moduleName.replace(/\//ig,'.')};
        RawMarkupNode.prototype.applyMarkup = function (elem) {
            elem.innerHTML = this._getMarkup();    //newElem will be appended to DOM, so we should always return valid DOMNode (can be TextDOMNode)
            //newElem will be appended to DOM, so we should always return valid DOMNode (can be TextDOMNode)
            var newElem = elem.firstChild || document.createTextNode('');
            this._setProperties(newElem);
            return newElem;
        };
        RawMarkupNode.prototype._getMarkup = function () {
            if (typeof this.markup !== 'string') {
                return '';
            }
            return this.markup.trim();
        };
        RawMarkupNode.prototype._setProperties = function (elem) {
            Object.keys(this.nodeProperties).forEach(function (name) {
                elem[name] = this.nodeProperties[name];
            }.bind(this));
        };
        return RawMarkupNode;
    }();
    exports.default = RawMarkupNode;
});