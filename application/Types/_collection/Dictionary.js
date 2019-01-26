/// <amd-module name="Types/_collection/Dictionary" />
/**
 * Тип данных словарь.
 * Это абстрактный класс, не предусмотрено создание самостоятельных экземпляров.
 * @class Types/Type/Dictionary
 * @implements Types/Collection/IEnumerable
 * @implements Types/Entity/IEquatable
 * @mixes Types/Entity/OptionsMixin
 * @mixes Types/Entity/ObservableMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_collection/Dictionary', [
    'require',
    'exports',
    'tslib',
    'Types/_collection/enumerator/Arraywise',
    'Types/_collection/enumerator/Objectwise',
    'Types/entity',
    'Types/util'
], function (require, exports, tslib_1, Arraywise_1, Objectwise_1, entity_1, util_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Dictionary = /** @class */
    function (_super) {
        tslib_1.__extends(Dictionary, _super);
        function Dictionary(options) {
            var _this = _super.call(this) || this;
            entity_1.OptionsToPropertyMixin.call(_this, options);
            entity_1.ObservableMixin.call(_this, options);
            _this._$dictionary = _this._$dictionary || [];
            return _this;
        }
        Dictionary.prototype.destroy = function () {
            entity_1.ObservableMixin.prototype.destroy.call(this);
            _super.prototype.destroy.call(this);
        };    /**
         * Возвращает словарь возможных значений
         * @param {Boolean} [localize=false] Вернуть локализованный словарь
         * @return {Array.<String>|Object.<String>}
         * @protected
         */
        /**
         * Возвращает словарь возможных значений
         * @param {Boolean} [localize=false] Вернуть локализованный словарь
         * @return {Array.<String>|Object.<String>}
         * @protected
         */
        Dictionary.prototype.getDictionary = function (localize) {
            var dictionary = localize && this._$localeDictionary ? this._$localeDictionary : this._$dictionary;
            return dictionary ? Array.isArray(dictionary) ? dictionary.slice() : Object.assign({}, dictionary) : dictionary;
        };
        Dictionary.prototype.each = function (callback, context, localize) {
            context = context || this;
            var enumerator = this.getEnumerator(localize);
            while (enumerator.moveNext()) {
                callback.call(context, enumerator.getCurrent(), enumerator.getCurrentIndex());
            }
        };
        Dictionary.prototype.getEnumerator = function (localize) {
            var dictionary = localize && this._$localeDictionary ? this._$localeDictionary : this._$dictionary;
            var enumerator = dictionary instanceof Array ? new Arraywise_1.default(dictionary) : new Objectwise_1.default(dictionary);
            enumerator.setFilter(function (item, index) {
                return index !== 'null';
            });
            return enumerator;
        };
        Dictionary.prototype.isEqual = function (to) {
            if (!(to instanceof Dictionary)) {
                return false;
            }
            var enumerator = this.getEnumerator();
            var toEnumerator = to.getEnumerator();
            var item;
            var hasItem;
            var toItem;
            var hasToItem;
            do {
                hasItem = enumerator.moveNext();
                hasToItem = toEnumerator.moveNext();
                item = hasItem ? enumerator.getCurrent() : undefined;
                toItem = hasToItem ? toEnumerator.getCurrent() : undefined;
                if (item !== toItem) {
                    return false;
                }
                if (enumerator.getCurrentIndex() !== toEnumerator.getCurrentIndex()) {
                    return false;
                }
            } while (hasItem || hasToItem);
            return true;
        };    //endregion
              //region Protected methods
              /**
         * Возвращает индекс значения в словаре
         * @param {String} name Значение в словаре
         * @param {Boolean} [localize=false] Это локализованное значение
         * @return {Number|String|undefined}
         * @protected
         */
        //endregion
        //region Protected methods
        /**
         * Возвращает индекс значения в словаре
         * @param {String} name Значение в словаре
         * @param {Boolean} [localize=false] Это локализованное значение
         * @return {Number|String|undefined}
         * @protected
         */
        Dictionary.prototype._getIndex = function (name, localize) {
            var enumerator = this.getEnumerator(localize);
            while (enumerator.moveNext()) {
                if (enumerator.getCurrent() === name) {
                    return enumerator.getCurrentIndex();
                }
            }
            return undefined;
        };    /**
         * Возвращает значение в словаре по индексу
         * @param {Number|String} index Индекс в словаре
         * @param {Boolean} [localize=false] Вернуть локализованное значение
         * @return {String}
         * @protected
         */
        /**
         * Возвращает значение в словаре по индексу
         * @param {Number|String} index Индекс в словаре
         * @param {Boolean} [localize=false] Вернуть локализованное значение
         * @return {String}
         * @protected
         */
        Dictionary.prototype._getValue = function (index, localize) {
            return localize && this._$localeDictionary ? this._$localeDictionary[index] : this._$dictionary[index];
        };    /**
         * Возвращает словарь из формата
         * @param {Types/Format/Field|Types/Format/UniversalField|String} format Формат поля
         * @return {Array}
         * @protected
         */
        /**
         * Возвращает словарь из формата
         * @param {Types/Format/Field|Types/Format/UniversalField|String} format Формат поля
         * @return {Array}
         * @protected
         */
        Dictionary.prototype._getDictionaryByFormat = function (format) {
            if (!format) {
                return [];
            }
            return (format.getDictionary ? format.getDictionary() : format.meta && format.meta.dictionary) || [];
        };    /**
         * Возвращает локализованный словарь из формата
         * @param {Types/Format/Field|Types/Format/UniversalField|String} format Формат поля
         * @return {Array|undefined}
         * @protected
         */
        /**
         * Возвращает локализованный словарь из формата
         * @param {Types/Format/Field|Types/Format/UniversalField|String} format Формат поля
         * @return {Array|undefined}
         * @protected
         */
        Dictionary.prototype._getLocaleDictionaryByFormat = function (format) {
            if (!format) {
                return;
            }
            return (format.getLocaleDictionary ? format.getLocaleDictionary() : format.meta && format.meta.localeDictionary) || undefined;
        };
        return Dictionary;
    }(entity_1.DestroyableMixin);
    exports.default = Dictionary;
    util_1.applyMixins(Dictionary, entity_1.OptionsToPropertyMixin, entity_1.ObservableMixin);
    Dictionary.prototype['[Types/_collection/Dictionary]'] = true;    // @ts-ignore
    // @ts-ignore
    Dictionary.prototype['[Types/_collection/IEnumerable]'] = true;    // @ts-ignore
    // @ts-ignore
    Dictionary.prototype['[Types/_entity/IEquatable]'] = true;    // @ts-ignore
    // @ts-ignore
    Dictionary.prototype._$dictionary = undefined;    // @ts-ignore
    // @ts-ignore
    Dictionary.prototype._$localeDictionary = undefined;    // @ts-ignore
    // @ts-ignore
    Dictionary.prototype._type = undefined;    //FIXME: backward compatibility for check via Core/core-instance::instanceOfMixin()
    //FIXME: backward compatibility for check via Core/core-instance::instanceOfMixin()
    Dictionary.prototype['[WS.Data/Collection/IEnumerable]'] = true;
});