/// <amd-module name="Types/_display/Abstract" />
/**
 * Абстрактная проекция данных.
 * Это абстрактный класс, не предназначенный для создания самостоятельных экземпляров.
 * @class Types/_display/Abstract
 * @mixes Types/_entity/DestroyableMixin
 * @mixes Types/_entity/OptionsMixin
 * @mixes Types/_entity/ObservableMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_display/Abstract', [
    'require',
    'exports',
    'tslib',
    'Types/entity',
    'Types/di',
    'Types/util'
], function (require, exports, tslib_1, entity_1, di_1, util_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Массив соответствия индексов проекций и коллекций
     */
    /**
     * Массив соответствия индексов проекций и коллекций
     */
    var displaysToCollections = [];    /**
     * Массив соответствия индексов проекций и их инстансов
     */
    /**
     * Массив соответствия индексов проекций и их инстансов
     */
    var displaysToInstances = [];    /**
     * Счетчик ссылок на singlton-ы
     */
    /**
     * Счетчик ссылок на singlton-ы
     */
    var displaysCounter = [];
    var Abstract = /** @class */
    function (_super) {
        tslib_1.__extends(Abstract, _super);    /** @lends Types/_display/Abstract.prototype */
        /** @lends Types/_display/Abstract.prototype */
        function Abstract(options) {
            var _this = _super.call(this, options) || this;
            entity_1.OptionsToPropertyMixin.call(_this, options);
            entity_1.ObservableMixin.call(_this, options);
            return _this;
        }
        Abstract.prototype.destroy = function () {
            entity_1.DestroyableMixin.prototype.destroy.call(this);
            entity_1.ObservableMixin.prototype.destroy.call(this);
        };    //region Statics
              /**
         * Возвращает проекцию по умолчанию
         * @param {Types/_collection/IEnumerable} collection Объект, для которого требуется получить проекцию
         * @param {Object} [options] Опции конструктора проекции
         * @param {Boolean} [single=false] Возвращать singleton для каждой collection
         * @return {Types/_display/Abstract}
         * @static
         */
        //region Statics
        /**
         * Возвращает проекцию по умолчанию
         * @param {Types/_collection/IEnumerable} collection Объект, для которого требуется получить проекцию
         * @param {Object} [options] Опции конструктора проекции
         * @param {Boolean} [single=false] Возвращать singleton для каждой collection
         * @return {Types/_display/Abstract}
         * @static
         */
        Abstract.getDefaultDisplay = function (collection, options, single) {
            if (arguments.length === 2 && typeof options !== 'object') {
                single = options;
                options = {};
            }
            var index = single ? displaysToCollections.indexOf(collection) : -1;
            if (index === -1) {
                options = options || {};
                options.collection = collection;
                var instance = void 0;
                if (collection && collection['[Types/_collection/IEnum]']) {
                    instance = di_1.create('Types/display:Enum', options);
                } else if (collection && collection['[Types/_collection/IFlags]']) {
                    instance = di_1.create('Types/display:Flags', options);
                } else if (collection && collection['[Types/_collection/IEnumerable]']) {
                    instance = di_1.create('Types/display:Collection', options);
                } else if (collection instanceof Array) {
                    instance = di_1.create('Types/display:Collection', options);
                } else {
                    throw new TypeError('Argument "collection" should implement Types/_collection/IEnumerable or be an instance of Array, but "' + collection + '" given.');
                }
                if (single) {
                    displaysToCollections.push(collection);
                    displaysToInstances.push(instance);
                    displaysCounter.push(1);
                }
                return instance;
            } else {
                displaysCounter[index]++;
                return displaysToInstances[index];
            }
        };    /**
         * Освобождает проекцию, которую запрашивали через getDefaultDisplay как singleton
         * @param {Types/_display/Abstract} display Проекция, полученная через getDefaultDisplay с single=true
         * @return {Boolean} Ссылка на проекцию была освобождена
         * @static
         */
        /**
         * Освобождает проекцию, которую запрашивали через getDefaultDisplay как singleton
         * @param {Types/_display/Abstract} display Проекция, полученная через getDefaultDisplay с single=true
         * @return {Boolean} Ссылка на проекцию была освобождена
         * @static
         */
        Abstract.releaseDefaultDisplay = function (display) {
            var index = displaysToInstances.indexOf(display);
            if (index === -1) {
                return false;
            }
            displaysCounter[index]--;
            if (displaysCounter[index] === 0) {
                displaysToInstances[index].destroy();
                displaysCounter.splice(index, 1);
                displaysToInstances.splice(index, 1);
                displaysToCollections.splice(index, 1);
            }
            return true;
        };
        return Abstract;
    }(util_1.mixin(entity_1.DestroyableMixin, entity_1.OptionsToPropertyMixin, entity_1.ObservableMixin)    /** @lends Types/_display/Abstract.prototype */);
    /** @lends Types/_display/Abstract.prototype */
    exports.default = Abstract;
    Abstract.prototype['[Types/_display/Abstract]'] = true;    // Deprecated
    // Deprecated
    Abstract.prototype['[WS.Data/Display/Display]'] = true;
});