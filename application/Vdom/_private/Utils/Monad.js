/// <amd-module name="Vdom/_private/Utils/Monad" />
define('Vdom/_private/Utils/Monad', [
    'require',
    'exports',
    'View/Executor/Utils'
], function (require, exports, Utils_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    function reduce(obj, callback, initialMemo, thisArg) {
        var memo = initialMemo;
        if (obj === null || obj === undefined) {
            obj = [];
        }
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                memo = callback.call(thisArg, memo, obj[key], key, obj);
            }
        }
        return memo;
    }
    function memoErrback(err) {
        Utils_1.Common.asyncRenderErrorLog(err);
        return err;
    }    /**
     * Получение конечного результата преобразований
     * @param mVal
     * @param mMemo
     * @param monad
     */
    /**
     * Получение конечного результата преобразований
     * @param mVal
     * @param mMemo
     * @param monad
     */
    function mapMWriterInner(mVal, mMemo, monad) {
        return monad.join(mVal, function (v) {
            return monad.join(mMemo, function (memo) {
                return monad.pure(memo.concat(v));
            });
        });
    }    /**
     * Для обработки вариантов построения списка нод
     * @param mVal
     * @param mMemo
     * @param monad
     * @returns {*}
     */
    /**
     * Для обработки вариантов построения списка нод
     * @param mVal
     * @param mMemo
     * @param monad
     * @returns {*}
     */
    function mapWriterMemo(mVal, mMemo, monad) {
        if (mMemo.then) {
            return mMemo.then(function (defMemo) {
                return mapMWriterInner(mVal, defMemo, monad);
            }, memoErrback);
        }
        return mapMWriterInner(mVal, mMemo, monad);
    }    /**
     * Для записи в результат списка нод, которые нуждаются в
     * действиях над ними
     * @param mVal
     * @param mMemo
     * @param monad
     * @returns {*}
     */
    /**
     * Для записи в результат списка нод, которые нуждаются в
     * действиях над ними
     * @param mVal
     * @param mMemo
     * @param monad
     * @returns {*}
     */
    function mapMWriter(mVal, mMemo, monad) {
        if (mVal.then) {
            return mVal.then(function (memoValue) {
                return mapWriterMemo(memoValue, mMemo, monad);
            }, memoErrback);
        }
        return mapWriterMemo(mVal, mMemo, monad);
    }
    function mapM(obj, iterateCallback, monad, context) {
        var memoInitial = monad.pure([]);
        return reduce(obj, function (mMemo, value, i) {
            return mapMWriter(iterateCallback.call(context, value, i), mMemo, monad);
        }, memoInitial);
    }
    exports.mapM = mapM;
    function createWriterMonad(monoid) {
        return {
            join: function (obj, fn) {
                var res = fn(obj.value);
                return {
                    value: res.value,
                    memo: monoid.plus(res.memo, obj.memo)
                };
            },
            pure: function (val) {
                return {
                    value: val,
                    memo: monoid.zero
                };
            }
        };
    }
    exports.createWriterMonad = createWriterMonad;
    exports.ArrayWriterMonad = createWriterMonad({
        plus: function (arr1, arr2) {
            return arr1.concat(arr2);
        },
        zero: []
    });
    exports.ListMonad = {
        join: function (arr, fn) {
            return reduce(arr, function (memo, v) {
                return memo.concat(fn(v));
            }, []);
        },
        pure: function (val) {
            return [val];
        }
    };
});