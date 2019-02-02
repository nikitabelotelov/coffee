define("Core/polyfill/PromiseAPIDeferred", ["require", "exports", "Core/Deferred", "Core/polyfill"], function (require, exports, Deferred) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Object.defineProperties(Promise.prototype, {
        addCallback: { value: addCallback },
        addCallbacks: { value: addCallbacks },
        addErrback: { value: addErrback },
        addBoth: { value: addBoth },
        callback: { value: callback },
        cancel: { value: cancel },
        createDependent: { value: createDependent },
        dependOn: { value: dependOn },
        errback: { value: errback },
        getResult: { value: getResult },
        isCallbacksLocked: { value: isCallbacksLocked },
        isReady: { value: isReady },
        isSuccessful: { value: isSuccessful },
    });
    /**
     * Добавляет обработчик на успех
     * @param {Function} onFulfilled
     * @returns {Deferred}
     */
    function addCallback(onFulfilled) {
        var def = new Deferred().addCallback(onFulfilled);
        return bindCallbacks(this, def);
    }
    /**
     * Добавляет обработчик на ошибку
     * @param {Function} onRejected
     * @returns {Deferred}
     */
    function addErrback(onRejected) {
        var def = new Deferred().addErrback(onRejected);
        return bindCallbacks(this, def);
    }
    /**
     * Добавляет обработчики: на успешный результат и на ошибку
     * @param {Function} onFulfilled обработчик успеха
     * @param {Function} onRejected  обработчик ошибки
     * @returns {Deferred}
     */
    function addCallbacks(onFulfilled, onRejected) {
        var def = new Deferred().addCallbacks(onFulfilled, onRejected);
        return bindCallbacks(this, def);
    }
    /**
     * Добавляет один обработчик на успех и на ошибку
     * @param {Function} onFulfilled общий обработчик.
     * @returns {Deferred}
     */
    function addBoth(onFulfilled) {
        var def = new Deferred().addBoth(onFulfilled);
        return bindCallbacks(this, def);
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
        var onFulfilled;
        var onReject;
        var promise = new Promise(function (resolve, reject) {
            onFulfilled = resolve;
            onReject = reject;
        });
        master.addCallbacks(function (res) {
            onFulfilled(res);
            return res;
        }, function (err) {
            onReject(err);
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
        // @ts-ignore
        new Promise(function (resolve_1, reject_1) { require(['Core/IoC'], resolve_1, reject_1); }).then(function (IoC) {
            IoC.resolve('ILogger').warn('Core/polyfill/PromiseAPIDeferred', message);
        });
    }
    function bindCallbacks(promise, deferred) {
        promise.then(function (res) {
            if (res instanceof Error) {
                deferred.errback(res);
                return;
            }
            deferred.callback(res);
        }, function (err) { deferred.errback(err); });
        return deferred;
    }
});
