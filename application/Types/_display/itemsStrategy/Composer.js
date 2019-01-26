/// <amd-module name="Types/_display/itemsStrategy/Composer" />
/**
 * Компоновщик стратегий; оборачивает стратегии одну в другую в заданном порядке
 * @class Types/Display/ItemsStrategy/Composer
 * @mixes Types/Entity/DestroyableMixin
 * @mixes Types/Entity/SerializableMixin
 * @author Мальцев А.А.
 */
define('Types/_display/itemsStrategy/Composer', [
    'require',
    'exports',
    'tslib',
    'Types/entity',
    'Types/util'
], function (require, exports, tslib_1, entity_1, util_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Composer = /** @class */
    function (_super) {
        tslib_1.__extends(Composer, _super);    /** @lends Types/Display/ItemsStrategy/Composer.prototype */
                                                /**
         * Конструктор
         */
        /** @lends Types/Display/ItemsStrategy/Composer.prototype */
        /**
         * Конструктор
         */
        function Composer() {
            var _this = _super.call(this) || this;    /**
             * Композируемые модули
             */
            /**
             * Композируемые модули
             */
            _this._modules = [];    /**
             * Параметры конструкторов композируемых модулей
             */
            /**
             * Параметры конструкторов композируемых модулей
             */
            _this._options = [];
            return _this;
        }
        Composer.prototype.destroy = function () {
            this._modules = null;
            this._options = null;
            this._result = null;
            _super.prototype.destroy.call(this);
        };    /**
         * Добавляет стратегию в конец
         * @param {Function} Module Конструктор стратегии
         * @param {Object} [options] Опции конструктора
         * @param {Function} [after] После какой стратегии добавить (по умолчанию в конец)
         * @return {Types/Display/ItemsStrategy/Composer}
         */
        /**
         * Добавляет стратегию в конец
         * @param {Function} Module Конструктор стратегии
         * @param {Object} [options] Опции конструктора
         * @param {Function} [after] После какой стратегии добавить (по умолчанию в конец)
         * @return {Types/Display/ItemsStrategy/Composer}
         */
        Composer.prototype.append = function (Module, options, after) {
            var index = this._modules.indexOf(after);
            if (index === -1) {
                index = this._modules.length;
            } else {
                index++;
            }
            this._modules.splice(index, 0, Module);
            this._options.splice(index, 0, options);
            this._reBuild(index, true);
            return this;
        };    /**
         * Добавляет стратегию в начало
         * @param {Function} Module Конструктор стратегии
         * @param {Object} options Опции конструктора
         * @param {Function} [before] Перед какой стратегией добавить (по умолчанию в начало)
         * @return {Types/Display/ItemsStrategy/Composer}
         */
        /**
         * Добавляет стратегию в начало
         * @param {Function} Module Конструктор стратегии
         * @param {Object} options Опции конструктора
         * @param {Function} [before] Перед какой стратегией добавить (по умолчанию в начало)
         * @return {Types/Display/ItemsStrategy/Composer}
         */
        Composer.prototype.prepend = function (Module, options, before) {
            var index = this._modules.indexOf(before);
            if (index === -1) {
                index = 0;
            }
            this._modules.splice(index, 0, Module);
            this._options.splice(index, 0, options);
            this._reBuild(index, true);
            return this;
        };    /**
         * Удалает стратегию
         * @param {Function} Module Конструктор стратегии
         * @return {Types/Display/IItemsStrategy} Удаленный экземпляр стратегии
         */
        /**
         * Удалает стратегию
         * @param {Function} Module Конструктор стратегии
         * @return {Types/Display/IItemsStrategy} Удаленный экземпляр стратегии
         */
        Composer.prototype.remove = function (Module) {
            var index = this._modules.indexOf(Module);
            if (index === -1) {
                return;
            }
            var instance = this._getInstance(index);
            this._modules.splice(index, 1);
            this._options.splice(index, 1);
            this._reBuild(index);
            return instance;
        };    /**
         * Сбрасывает компоновщик
         * @return {Types/Display/ItemsStrategy/Composer}
         */
        /**
         * Сбрасывает компоновщик
         * @return {Types/Display/ItemsStrategy/Composer}
         */
        Composer.prototype.reset = function () {
            this._modules.length = 0;
            this._options.length = 0;
            this._result = null;
            return this;
        };    /**
         * Возвращает экземпляр стратегии
         * @param {Function} Module Конструктор стратегии
         * @return {Types/Display/IItemsStrategy} Экземпляр стратегии
         */
        /**
         * Возвращает экземпляр стратегии
         * @param {Function} Module Конструктор стратегии
         * @return {Types/Display/IItemsStrategy} Экземпляр стратегии
         */
        Composer.prototype.getInstance = function (Module) {
            var index = this._modules.indexOf(Module);
            if (index === -1) {
                return;
            }
            return this._getInstance(index);
        };    /**
         * Возвращает результат компоновки
         * @return {Types/Display/IItemsStrategy} Экземпляр стратегии
         */
        /**
         * Возвращает результат компоновки
         * @return {Types/Display/IItemsStrategy} Экземпляр стратегии
         */
        Composer.prototype.getResult = function () {
            return this._result;
        };    //endregion Public members
              //region Types/Entity/SerializableMixin
        //endregion Public members
        //region Types/Entity/SerializableMixin
        Composer.prototype._getSerializableState = function (state) {
            state = entity_1.SerializableMixin.prototype._getSerializableState.call(this, state);
            state.$options = {};
            state._modules = this._modules;
            state._options = this._options;
            state._result = this._result;
            return state;
        };
        Composer.prototype._setSerializableState = function (state) {
            var fromSerializableMixin = entity_1.SerializableMixin.prototype._setSerializableState(state);
            return function () {
                fromSerializableMixin.call(this);
                this._modules = state._modules;
                this._options = state._options;
                this._result = state._result;
            };
        };    //endregion Types/Entity/SerializableMixin
              //region Protected members
        //endregion Types/Entity/SerializableMixin
        //region Protected members
        Composer.prototype._reBuild = function (index, onAdd) {
            var _this = this;
            var wrap = function (source, Module, defaults) {
                var options = Object.assign({}, defaults || {});
                if (source) {
                    options.source = source;
                }
                return new Module(options);
            };    //Just add or remove if last item affected
            //Just add or remove if last item affected
            if (this._result && index === this._modules.length + (onAdd ? -1 : 0)) {
                if (onAdd) {
                    this._result = wrap(this._result, this._modules[index], this._options[index]);
                } else {
                    this._result = this._result.source;
                }
                return;
            }
            this._result = this._modules.reduce(function (memo, Module, index) {
                return wrap(memo, Module, _this._options[index]);
            }, null);
        };
        Composer.prototype._getInstance = function (index) {
            var target = this._modules.length - index - 1;
            var current = 0;
            var item = this._result;
            while (target > current) {
                item = item.source;
                current++;
            }
            return item;
        };
        return Composer;
    }(util_1.mixin(entity_1.DestroyableMixin, entity_1.SerializableMixin)    /** @lends Types/Display/ItemsStrategy/Composer.prototype */);
    /** @lends Types/Display/ItemsStrategy/Composer.prototype */
    exports.default = Composer;
    Composer.prototype._moduleName = 'Types/display:itemsStrategy.Composer';
    Composer.prototype['[Types/_display/itemsStrategy/Composer]'] = true;    // @ts-ignore
    // @ts-ignore
    Composer.prototype._result = null;
});