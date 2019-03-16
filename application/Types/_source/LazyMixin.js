/// <amd-module name="Types/_source/LazyMixin" />
/**
 * Миксин, позволяющий загружать некоторые зависимости лениво.
 * @mixin Types/_source/LazyMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_source/LazyMixin', [
    'require',
    'exports',
    'Core/Deferred'
], function (require, exports, Deferred) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    // tslint:disable-next-line:ban-comma-operator
    // tslint:disable-next-line:ban-comma-operator
    var global = (0, eval)('this');
    var DeferredCanceledError = global.DeferredCanceledError;
    var LazyMixin = /** @lends Types/_source/LazyMixin.prototype */
    {
        '[Types/_source/LazyMixin]': true,
        /**
         * @property {Array.<String>} Список зависимостей, которые нужно загружать лениво
         */
        _additionalDependencies: [
            'Types/source',
            'Types/entity',
            'Types/collection'
        ],
        /**
         * Загружает дополнительные зависимости
         * @param {Function(Core/Deferred)} [callback] Функция обратного вызова при успешной загрузке зависимостей
         * @return {Core/Deferred}
         * @protected
         */
        // tslint:disable-next-line:ban-types
        _loadAdditionalDependencies: function (callback) {
            var _this = this;
            var deps = this._additionalDependencies;
            var depsLoaded = deps.reduce(function (prev, curr) {
                return prev && require.defined(curr);
            }, true);
            var result = new Deferred();
            if (depsLoaded) {
                if (callback) {
                    callback.call(this, result);
                } else {
                    result.callback();
                }
            } else {
                // XXX: this case isn't covering by tests because all dependencies are always loaded in tests
                require(deps, function () {
                    // Don't call callback() if deferred has been cancelled during require
                    if (callback && (!result.isReady() || !(result.getResult() instanceof DeferredCanceledError))) {
                        callback.call(_this, result);
                    } else {
                        result.callback();
                    }
                }, function (error) {
                    return result.errback(error);
                });
            }
            return result;
        },
        /**
         * Связывает два деферреда, назначая результат работы ведущего результом ведомого.
         * @param {Core/Deferred} master Ведущий
         * @param {Core/Deferred} slave Ведомый
         * @protected
         */
        // tslint:disable-next-line:ban-types
        _connectAdditionalDependencies: function (master, slave) {
            // Cancel master on slave cancelling
            if (!slave.isCallbacksLocked()) {
                slave.addErrback(function (err) {
                    if (err instanceof DeferredCanceledError) {
                        master.cancel();
                    }
                    return err;
                });
            }    // Connect master's result with slave's result
            // Connect master's result with slave's result
            master.addCallbacks(function (result) {
                slave.callback(result);
                return result;
            }, function (err) {
                slave.errback(err);
                return err;
            });
        }
    };
    exports.default = LazyMixin;
});