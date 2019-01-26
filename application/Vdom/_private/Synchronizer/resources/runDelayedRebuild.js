/// <amd-module name="Vdom/_private/Synchronizer/resources/runDelayedRebuild" />
define('Vdom/_private/Synchronizer/resources/runDelayedRebuild', [
    'require',
    'exports',
    'Core/helpers/Function/runDelayed'
], function (require, exports, runDelayed) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var checkPageVisibility = function checkPageVisibility() {
            var hidden = null;
            if (typeof document !== 'undefined') {
                if (typeof document.hidden !== 'undefined') {
                    // Opera 12.10 and Firefox 18 and later support
                    hidden = 'hidden';
                } else if (typeof document.msHidden !== 'undefined') {
                    hidden = 'msHidden';
                } else if (typeof document.webkitHidden !== 'undefined') {
                    hidden = 'webkitHidden';
                }
            }
            return hidden;
        }, pageVisibility = checkPageVisibility();    /**
     * Function runDelayedRebuild module <b>runDelayed(fn)</b>.
     *
     * Method checks if browser tab active or not and depending on tab state
     * calls function runDelayed function or setTimeout
     *
     * <h2>Function params</h2>
     * <ul>
     *     <li><b>fn</b> {Function} - function to be called asynchronously.</li>
     * </ul>
     *
     * @class Vdom/Synchronizer/resources/runDelayedRebuild
     * @public
     * @author Изыгин Н.Р.
     */
    /**
     * Function runDelayedRebuild module <b>runDelayed(fn)</b>.
     *
     * Method checks if browser tab active or not and depending on tab state
     * calls function runDelayed function or setTimeout
     *
     * <h2>Function params</h2>
     * <ul>
     *     <li><b>fn</b> {Function} - function to be called asynchronously.</li>
     * </ul>
     *
     * @class Vdom/Synchronizer/resources/runDelayedRebuild
     * @public
     * @author Изыгин Н.Р.
     */
    function runDelayedRebuild(fn) {
        if (pageVisibility && document[pageVisibility]) {
            setTimeout(fn, 0);
        } else {
            runDelayed(fn);
        }
    }
    exports.default = runDelayedRebuild;
});