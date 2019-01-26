
/// <amd-module name='Core/polyfill/PromiseAPIDeferred'/>
// @ts-ignore
import Deferred = require('Core/Deferred');
import 'Core/polyfill';
Object.defineProperties(Promise.prototype, {
    addCallback: {
        value: addCallback,
    },
    addCallbacks: {
        value: addCallbacks,
    },
    addErrback: {
        value: addErrback,
    },
    addBoth: {
        value: addBoth,
    },
    callback: {
        value: callback,
    },
    cancel: {
        value: cancel,
    },
    createDependent: {
        value: createDependent,
    },
    dependOn: {
        value: dependOn,
    },
    errback: {
        value: errback,
    },
    getResult: {
        value: getResult,
    },
    isCallbacksLocked: {
        value: isCallbacksLocked,
    },
    isReady: {
        value: isReady,
    },
    isSuccessful: {
        value: isSuccessful,
    },
});

/**
 * Добавляет обработчик на успех
 * @param {Function} onFulfilled
 * @returns {Deferred}
 */
function addCallback(onFulfilled) {
    const def = new Deferred().addCallback(onFulfilled);
    this.then((res) => {
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
 * @param {Function} onRejected
 * @returns {Deferred}
 */
function addErrback(onRejected) {
    const def = new Deferred().addErrback(onRejected);
    this.catch((err) => { def.errback(err); });
    return def;
}

/**
 * Добавляет обработчики: на успешный результат и на ошибку
 * @param {Function} onFulfilled обработчик успеха
 * @param {Function} onRejected  обработчик ошибки
 * @returns {Deferred}
 */
function addCallbacks(onFulfilled, onRejected) {
    const def = new Deferred().addCallbacks(onFulfilled, onRejected);
    this.then((res) => {
        if (res instanceof Error) {
            def.errback(res);
            return;
        }
        def.callback(res);
    }, (err) => { def.errback(err); });
    return def;
}

/**
 * Добавляет один обработчик на успех и на ошибку
 * @param {Function} onFulfilled общий обработчик.
 * @returns {Deferred}
 */
function addBoth(onFulfilled) {
    const def = new Deferred().addBoth(onFulfilled);
    this.then((res) => {
        if (res instanceof Error) {
            def.errback(res);
            return;
        }
        def.callback(res);
    }, (err) => { def.errback(err); });
    return def;
}

/**
 * Запускает на выполнение цепочку коллбэков.
 * @param {any|void} [res] результат асинхронной операции, передаваемой в коллбэк.
 */
function callback(): never {
    throw new Error('Нельзя вызвать метод callback у Promise');
}

/**
 * Запуск цепочки обработки err-бэков.
 * @param {any} [err] результат асинхронной операции.
 * @param {boolean} [checkCallback=false] включить проверку наличия callback обработки ошибок
 */
function errback(): never {
    throw new Error('Нельзя вызвать метод errback у Promise');
}

/**
 * Объявляет данный текущий Deferred зависимым от другого.
 * Колбэк/Еррбэк текущего Deferred будет вызван
 * при соотвествтующем событии в "мастер"-Deferred.
 * @param {Deferred} master Deferred, от которого будет зависеть данный.
 * @return {Promise<any | Error>}
 */
function dependOn(master: Promise<any> | Deferred): Promise<any> | never {
    if (master instanceof Promise) {
        throw new Error('Нельзя вызвать метод dependOn у Promise');
    }
    let onFulfilled: (value: any) => void;
    let onReject: (error: Error) => void;

    const promise = new Promise((resolve: (error: any) => never, reject: (error: any) => never) => {
        onFulfilled = resolve;
        onReject = reject;
    });

    master.addCallbacks((res) => {
        onFulfilled(res);
        return res;
    }, (err) => {
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
function createDependent(): Promise<any> {
    return this.then((value) => value, (error) => { throw error; });
}

/**
 * Показывает, не запрещено ли пользоваться методами, добавляющими обработчики:
 * addCallbacks/addCallback/addErrback/addBoth.
 * Не влияет на возможность вызова методов callback/errback.
 * @return {boolean} false - добавлять обработчики можно.
 */
function isCallbacksLocked(): boolean {
    return false;
}

/**
 * Проверяет возможность вызова методов callback/errback
 * @param {boolean} [withChain=false] Проверять, отработала ли цепочка обработчиков.
 * @returns {boolean} true
 */
function isReady(withChain = false): boolean {
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
function logError(message: string) {
   //@ts-ignore
   import('Core/IoC').then((IoC) => { // tslint:disable-line
        IoC.resolve('ILogger').warn('Core/polyfill/PromiseAPIDeferred', message);
    });
}
