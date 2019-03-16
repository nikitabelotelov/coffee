define('Browser/Storage', [
    'require',
    'exports',
    'Browser/_Storage/utils',
    'Browser/_Storage/Local',
    'Browser/_Storage/LocalNative',
    'Browser/_Storage/Session'
], function (require, exports, storageUtils, Local_1, LocalNative_1, Session_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.LocalStorage = Local_1.default;
    exports.LocalStorageNative = LocalNative_1.default;
    exports.SessionStorage = Session_1.default;
    exports.utils = storageUtils;
});