define("Core/polyfill/PromiseAPIDeferred", ["require", "exports", "Core/Deferred", "Core/polyfill"], function (require, exports, Deferred) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Object.defineProperties(Promise.prototype, {
        addCallback: {
            value: addCallback
        },
        addCallbacks: {
            value: addCallbacks
        },
        addErrback: {
            value: addErrback
        },
        addBoth: {
            value: addBoth
        },
        callback: {
            value: callback
        },
        cancel: {
            value: cancel
        },
        createDependent: {
            value: createDependent
        },
        dependOn: {
            value: dependOn
        },
        errback: {
            value: errback
        },
        getResult: {
            value: getResult
        },
        isCallbacksLocked: {
            value: isCallbacksLocked
        },
        isReady: {
            value: isReady
        },
        isSuccessful: {
            value: isSuccessful
        },
    });
    /**
     * Добавляет обработчик на успех
     * @param {Function} callback
     * @returns {Deferred}
     */
    function addCallback(callback) {
        var def = new Deferred().addCallback(callback);
        this.then(function (res) {
            if (res instanceof Error) {
                def.errback(res);
                return;
            }
            def.callback(res);
        });
        return def;
    }
    /**
     * Добавляет обработчик на ошибку
     * @param {Function} onerror
     * @returns {Deferred}
     */
    function addErrback(onerror) {
        var def = new Deferred().addErrback(onerror);
        this.catch(function (err) { return def.errback(err); });
        return def;
    }
    /**
     * Добавляет обработчики: на успешный результат и на ошибку
     * @param {Function} callback обработчик успеха
     * @param {Function} errback  обработчик ошибки
     * @returns {Deferred}
     */
    function addCallbacks(callback, errback) {
        var def = new Deferred().addCallbacks(callback, errback);
        this.then(function (res) {
            if (res instanceof Error) {
                def.errback(res);
                return;
            }
            def.callback(res);
        }, function (err) { return def.errback(err); });
        return def;
    }
    /**
     * Добавляет один обработчик на успех и на ошибку
     * @param {Function} callback общий обработчик.
     * @returns {Deferred}
     */
    function addBoth(callback) {
        var def = new Deferred().addBoth(callback);
        this.then(function (res) {
            if (res instanceof Error) {
                def.errback(res);
                return;
            }
            def.callback(res);
        }, function (err) { return def.errback(err); });
        return def;
    }
    /**
     * Запускает на выполнение цепочку коллбэков.
     * @param {any|void} [res] результат асинхронной операции, передаваемой в коллбэк.
     */
    function callback() {
        throw new Error('Нельзя вызвать метод callback у Promise');
    }
    /**
     * Запуск цепочки обработки err-бэков.
     * @param {any} [err] результат асинхронной операции.
     * @param {boolean} [checkCallback=false] включить проверку наличия callback обработки ошибок
     */
    function errback() {
        throw new Error('Нельзя вызвать метод errback у Promise');
    }
    /**
     * Объявляет данный текущий Deferred зависимым от другого.
     * Колбэк/Еррбэк текущего Deferred будет вызван
     * при соотвествтующем событии в "мастер"-Deferred.
     * @param {Deferred} master Deferred, от которого будет зависеть данный.
     * @return {Promise<any | Error>}
     */
    function dependOn(master) {
        if (master instanceof Promise) {
            throw new Error('Нельзя вызвать метод dependOn у Promise');
        }
        var callback = function (value) { return value; };
        var errback = function (error) { throw error; };
        var promise = new Promise(function (resolve, reject) {
            callback = resolve;
            errback = reject;
        });
        master.addCallbacks(function (res) {
            callback(res);
            return res;
        }, function (err) {
            errback(err);
            return err;
        });
        return promise;
    }
    /**
     * Создаёт новый Promise, зависимый от этого.
     * Колбэк/Еррбэк этого нового Promise-а будут вызваны при соотвествтующем событии исходного.
     * @returns {Promise}
     */
    function createDependent() {
        return this.then(function (value) { return value; }, function (error) { throw error; });
    }
    /**
     * Показывает, не запрещено ли пользоваться методами, добавляющими обработчики:
     * addCallbacks/addCallback/addErrback/addBoth.
     * Не влияет на возможность вызова методов callback/errback.
     * @return {boolean} false - добавлять обработчики можно.
     */
    function isCallbacksLocked() {
        return false;
    }
    /**
     * Проверяет возможность вызова методов callback/errback
     * @param {boolean} [withChain=false] Проверять, отработала ли цепочка обработчиков.
     * @returns {boolean} true
     */
    function isReady(withChain) {
        if (withChain === void 0) { withChain = false; }
        return true;
    }
    function cancel() {
        throw new Error('Вызыван метод cancel у Promise');
    }
    function getResult() {
        logError('Вызыван метод getResult у Promise');
    }
    function isSuccessful() {
        logError('Вызыван метод isSuccessful у Promise');
    }
    /**
     * Вывод ошибок в консоль
     * @param {string} message текст ошибки
     */
    function logError(message) {
        //@ts-ignore
        new Promise(function (resolve_1, reject_1) { require(['Core/IoC'], resolve_1, reject_1); }).then(function (IoC) {
            IoC.resolve('ILogger').warn('Core/polyfill/PromiseAPIDeferred', message);
        });
    }
});
