/// <amd-module name="View/Executor/_Expressions/Focus" />
define('View/Executor/_Expressions/Focus', [
    'require',
    'exports',
    'View/Executor/_Expressions/AttrHelper'
], function (require, exports, AttrHelper_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    function closest(target, root) {
        while (target) {
            if (target === root)
                return true;
            target = target.parentElement;
        }
        return false;
    }
    exports.closest = closest;
    function prepareAttrsForFocus(attributes, opts) {
        if (!attributes) {
            return;
        }
        var prefix = '';
        if (AttrHelper_1.checkAttr(attributes) || AttrHelper_1.checkAttr(opts)) {
            prefix = 'attr:';
        }
        attributes[prefix + 'ws-creates-context'] = attributes[prefix + 'ws-creates-context'] || 'default';
        attributes[prefix + 'ws-delegates-tabfocus'] = attributes[prefix + 'ws-delegates-tabfocus'] || 'default';
        if (opts[prefix + 'ws-creates-context'] === 'true') {
            attributes[prefix + 'ws-creates-context'] = 'true';
        }
        if (opts[prefix + 'ws-delegates-tabfocus'] === 'true') {
            attributes[prefix + 'ws-delegates-tabfocus'] = 'true';
        }
        if (opts[prefix + 'ws-tab-cycling'] === 'true') {
            attributes[prefix + 'ws-tab-cycling'] = 'true';
        }
        if (opts[prefix + 'ws-autofocus'] === 'true') {
            attributes[prefix + 'ws-autofocus'] = 'true';
        }
        if (opts[prefix + 'ws-no-focus'] === 'true') {
            attributes[prefix + 'ws-no-focus'] = 'true';
        }
        if (opts.hasOwnProperty(prefix + 'tabindex')) {
            attributes[prefix + 'tabindex'] = opts[prefix + 'tabindex'] + '';
        }
    }
    exports.prepareAttrsForFocus = prepareAttrsForFocus;    // поправляет табиндекс для атрибутов, предназначенных для элемента, образующего контекст табиндексов
                                                            // табиндекс должен быть по умолчанию 0, табиндекса не может не быть вообще
    // поправляет табиндекс для атрибутов, предназначенных для элемента, образующего контекст табиндексов
    // табиндекс должен быть по умолчанию 0, табиндекса не может не быть вообще
    function prepareTabindex(attrs) {
        if (attrs['ws-creates-context'] === 'true') {
            if (!attrs.hasOwnProperty('tabindex')) {
                attrs.tabindex = '0';
            }
        }
    }
    exports.prepareTabindex = prepareTabindex;    /**
     * Функция выставляет дефолтные атрибуты для фокусов
     * @param attrs - Объект, в котором хранятся атрибуты
     * @param newAttrs - опциональный аргумент, отсюда возьмутся атрибуты, если они есть
     * иначе атрибуты выставятся в true
     */
    /**
     * Функция выставляет дефолтные атрибуты для фокусов
     * @param attrs - Объект, в котором хранятся атрибуты
     * @param newAttrs - опциональный аргумент, отсюда возьмутся атрибуты, если они есть
     * иначе атрибуты выставятся в true
     */
    function resetDefaultValues(attrs, newAttrs) {
        if (attrs['ws-creates-context'] === 'default') {
            attrs['ws-creates-context'] = newAttrs && newAttrs['ws-creates-context'] || 'true';
        }
        if (attrs['ws-delegates-tabfocus'] === 'default') {
            attrs['ws-delegates-tabfocus'] = newAttrs && newAttrs['ws-delegates-tabfocus'] || 'true';
        }
        if (attrs['attr:ws-creates-context'] === 'default') {
            attrs['attr:ws-creates-context'] = newAttrs && newAttrs['attr:ws-creates-context'] || 'true';
        }
        if (attrs['attr:ws-delegates-tabfocus'] === 'default') {
            attrs['attr:ws-delegates-tabfocus'] = newAttrs && newAttrs['attr:ws-delegates-tabfocus'] || 'true';
        }
    }
    exports.resetDefaultValues = resetDefaultValues;    /**
     * Функция нужна для патчинга корневых элементов при маутинге
     * Вызывается только из createControl!
     * @param dom
     * @param cfg
     */
    /**
     * Функция нужна для патчинга корневых элементов при маутинге
     * Вызывается только из createControl!
     * @param dom
     * @param cfg
     */
    function patchDom(dom, cfg) {
        dom = dom[0] ? dom[0] : dom;
        var attributes = dom.attributes, attrObj = {}, attrList = [
                'ws-delegates-focus',
                'ws-creates-context',
                'ws-autofocus',
                'tabindex',
                'ws-no-focus'
            ];
        for (var idx in attrList) {
            var attrName = attrList[idx], attr = attributes.getNamedItem(attrName);
            if (attr) {
                attrObj[attrName] = attr.value;    //Копируем необходимые атрибуты
            }
        }
        //Копируем необходимые атрибуты
        prepareAttrsForFocus(attrObj, cfg);
        resetDefaultValues(attrObj, cfg);
        prepareTabindex(attrObj);
        for (var key in attrObj) {
            dom.setAttribute(key, attrObj[key]);
        }
    }
    exports.patchDom = patchDom;
});