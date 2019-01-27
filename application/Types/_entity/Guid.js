define('Types/_entity/Guid', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    ///<amd-module name="Types/_entity/Guid" />
                                                                      /**
     * Guid
     * @class Types/_entity/Guid
     * @public
     * @author Мальцев А.А.
     */
    ///<amd-module name="Types/_entity/Guid" />
    /**
     * Guid
     * @class Types/_entity/Guid
     * @public
     * @author Мальцев А.А.
     */
    var Guid = /** @class */
    function () {
        function Guid() {
        }    /**
         * return random numbers that look like GUIDs
         * @return {String}
         */
        /**
         * return random numbers that look like GUIDs
         * @return {String}
         */
        Guid.create = function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : r & 3 | 8;
                return v.toString(16);
            });
        };
        return Guid;
    }();
    exports.default = Guid;
});