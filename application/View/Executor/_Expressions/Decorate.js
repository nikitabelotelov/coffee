/// <amd-module name="View/Executor/_Expressions/Decorate" />
define('View/Executor/_Expressions/Decorate', [
    'require',
    'exports',
    'View/Executor/_Expressions/AttrHelper'
], function (require, exports, AttrHelper_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Создание объекта, для декорировния рутового узла
     * @param dataTemplateid
     * @param hasMarkup
     * @param componentName
     * @returns {{config: *, hasmarkup: *, data-component: *}}
     */
    /**
     * Создание объекта, для декорировния рутового узла
     * @param dataTemplateid
     * @param hasMarkup
     * @param componentName
     * @returns {{config: *, hasmarkup: *, data-component: *}}
     */
    function createRootDecoratorObject(dataTemplateid, hasMarkup, componentName, addingAttributes) {
        var obj = {
            'config': dataTemplateid,
            'hasMarkup': hasMarkup,
            'data-component': componentName
        };
        for (var attr in addingAttributes) {
            if (addingAttributes.hasOwnProperty(attr)) {
                if (attr === 'config') {
                    obj[attr] = addingAttributes[attr] + ',' + obj[attr];
                } else {
                    obj[attr] = addingAttributes[attr];
                }
            }
        }
        if (typeof window !== 'undefined') {
            // We should be able to get component's config id before VDom mounting
            // The config attribute will be removed later
            var configKey = AttrHelper_1.checkAttr(obj) ? 'attr:__config' : '__config';
            if (obj[configKey]) {
                // DOM element can have multiple VDOM components attached to it
                obj[configKey] += ',' + obj.config;
            } else {
                obj[configKey] = obj.config;
            }
        }
        return obj;
    }
    exports.createRootDecoratorObject = createRootDecoratorObject;
});