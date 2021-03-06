define('Vdom/_private/Utils/Focus', [
    'require',
    'exports',
    'Env/Env',
    'Vdom/_private/Synchronizer/resources/TabIndex'
], function (require, exports, Env_1, Tabindex) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Moves focus to a specific HTML element
     * @param {HTMLElement} element Element to move focus to
     */
    /**
     * Moves focus to a specific HTML element
     * @param {HTMLElement} element Element to move focus to
     */
    function focus(element) {
        if (element) {
            if (Env_1.detection.isIE && element.setActive) {
                // In IE, calling `focus` scrolls the focused element into view,
                // which is not the desired behavior. Built-in `setActive` method
                // makes the element active without scrolling to it
                try {
                    element.setActive();
                } catch (e) {
                    Tabindex.focus(element);
                }
            } else {
                Tabindex.focus(element);
            }
        }
    }
    exports.focus = focus;
});