define("Core/LocalStorageNative", ["require", "exports", "Browser/Storage", "Env/Env"], function (require, exports, Storage_1, Env_1) {
    "use strict";
    Env_1.IoC.resolve('ILogger').log("Core/LocalStorageNative", 'module has been moved to "Browser/Storage:LocalStorageNative" and will be removed');
    return Storage_1.LocalStorageNative;
});
