/// <amd-module name="Types/_entity/relation/ManyToMany" />
/**
 * Посредник, реализующий отношения "многие ко многим".
 * @class Types/_entity/relation/ManyToMany
 * @mixes Types/_entity/DestroyableMixin
 * @author Мальцев А.А.
 */
define('Types/_entity/relation/ManyToMany', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/DestroyableMixin',
    'Types/shim'
], function (require, exports, tslib_1, DestroyableMixin_1, shim_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Проверяет, что объект "живой" (не был уничтожен)
     * @param {Object} entity Объект
     * @return {Boolean}
     */
    /**
     * Проверяет, что объект "живой" (не был уничтожен)
     * @param {Object} entity Объект
     * @return {Boolean}
     */
    function isAlive(entity) {
        return entity instanceof Object && entity['[Types/_entity/DestroyableMixin]'] ? !entity.destroyed : true;
    }
    var ManyToMany = /** @class */
    function (_super) {
        tslib_1.__extends(ManyToMany, _super);    /** @lends Types/_entity/relation/ManyToMany.prototype */
        /** @lends Types/_entity/relation/ManyToMany.prototype */
        function ManyToMany() {
            var _this = _super.call(this) || this;
            _this._hasMany = new shim_1.Map();
            _this._hasManyName = new shim_1.Map();
            _this._belongsTo = new shim_1.Map();
            _this._belongsToName = new shim_1.Map();
            return _this;
        }
        ManyToMany.prototype.destroy = function () {
            this._hasMany = null;
            this._hasManyName = null;
            this._belongsTo = null;
            this._belongsToName = null;
            _super.prototype.destroy.call(this);
        };    // region Public methods
              /**
         * Добавляет отношение между двумя сущностями
         * @param {Object} master Главная сущность
         * @param {Object} slave Зависимая сущность
         * @param {String} [name] Название отношения
         */
        // region Public methods
        /**
         * Добавляет отношение между двумя сущностями
         * @param {Object} master Главная сущность
         * @param {Object} slave Зависимая сущность
         * @param {String} [name] Название отношения
         */
        ManyToMany.prototype.addRelationship = function (master, slave, name) {
            this._addHasMany(master, slave, name);
            this._addBelongsTo(slave, master, name);
        };    /**
         * Удаляет отношение между двумя сущностями
         * @param {Object} master Главная сущность
         * @param {Object} slave Зависимая сущность
         */
        /**
         * Удаляет отношение между двумя сущностями
         * @param {Object} master Главная сущность
         * @param {Object} slave Зависимая сущность
         */
        ManyToMany.prototype.removeRelationship = function (master, slave) {
            this._removeHasMany(master, slave);
            this._removeBelongsTo(slave, master);
        };    /**
         * Очищает все отношения указанной сущности
         * @param {Object} entity Сущность
         */
        /**
         * Очищает все отношения указанной сущности
         * @param {Object} entity Сущность
         */
        ManyToMany.prototype.clear = function (entity) {
            var _this = this;
            if (this._hasMany.has(entity)) {
                this._hasMany.get(entity).forEach(function (slave) {
                    _this._removeBelongsTo(slave, entity);
                });
                this._hasMany.delete(entity);
                this._hasManyName.delete(entity);
            }
            if (this._belongsTo.has(entity)) {
                this._belongsTo.get(entity).forEach(function (master) {
                    _this._removeHasMany(master, entity);
                });
                this._belongsTo.delete(entity);
                this._belongsToName.delete(entity);
            }
        };    /**
         * Возвращает все зависимые сущности
         * @param {Object} master Главная сущность
         * @param {Function(Object, String)} callback Функция обратного вызова для каждой зависимой сущности
         */
        /**
         * Возвращает все зависимые сущности
         * @param {Object} master Главная сущность
         * @param {Function(Object, String)} callback Функция обратного вызова для каждой зависимой сущности
         */
        ManyToMany.prototype.hasMany = function (master, callback) {
            var _this = this;
            if (this._hasMany.has(master)) {
                var names_1 = this._hasManyName.get(master);
                this._hasMany.get(master).forEach(function (slave) {
                    if (isAlive(slave)) {
                        callback.call(_this, slave, names_1.get(slave));
                    }
                });
            }
        };    /**
         * Возвращает все главные сущности
         * @param {Object} slave Зависимая сущность
         * @param {Function(Object, String)} callback Функция обратного вызова для каждой главной сущности
         */
        /**
         * Возвращает все главные сущности
         * @param {Object} slave Зависимая сущность
         * @param {Function(Object, String)} callback Функция обратного вызова для каждой главной сущности
         */
        ManyToMany.prototype.belongsTo = function (slave, callback) {
            var _this = this;
            if (this._belongsTo.has(slave)) {
                var names_2 = this._belongsToName.get(slave);
                this._belongsTo.get(slave).forEach(function (master) {
                    if (isAlive(master)) {
                        callback.call(_this, master, names_2.get(master));
                    }
                });
            }
        };    // endregion Public methods
              // region Protected methods
              /**
         * Добавляет отношение вида hasMany
         * @param {Object} master Главная сущность
         * @param {Object} slave Зависимая сущность
         * @param {String} name Название отношения
         * @protected
         */
        // endregion Public methods
        // region Protected methods
        /**
         * Добавляет отношение вида hasMany
         * @param {Object} master Главная сущность
         * @param {Object} slave Зависимая сущность
         * @param {String} name Название отношения
         * @protected
         */
        ManyToMany.prototype._addHasMany = function (master, slave, name) {
            var slaves;
            var names;
            if (this._hasMany.has(master)) {
                slaves = this._hasMany.get(master);
                names = this._hasManyName.get(master);
            } else {
                slaves = new shim_1.Set();
                names = new shim_1.Map();
                this._hasMany.set(master, slaves);
                this._hasManyName.set(master, names);
            }
            slaves.add(slave);
            names.set(slave, name);
        };    /**
         * Удаляет отношение вида hasMany
         * @param {Object} master Главная сущность
         * @param {Object} slave Зависимая сущность
         * @protected
         */
        /**
         * Удаляет отношение вида hasMany
         * @param {Object} master Главная сущность
         * @param {Object} slave Зависимая сущность
         * @protected
         */
        ManyToMany.prototype._removeHasMany = function (master, slave) {
            if (this._hasMany.has(master)) {
                var slaves = this._hasMany.get(master);
                slaves.delete(slave);
                this._hasManyName.get(master).delete(slave);
                if (slaves.size === 0) {
                    this._hasMany.delete(master);
                    this._hasManyName.delete(master);
                }
            }
        };    /**
         * Добавляет отношение вида belongsTo
         * @param {Object} master Главная сущность
         * @param {Object} slave Зависимая сущность
         * @param {String} name Название отношения
         * @protected
         */
        /**
         * Добавляет отношение вида belongsTo
         * @param {Object} master Главная сущность
         * @param {Object} slave Зависимая сущность
         * @param {String} name Название отношения
         * @protected
         */
        ManyToMany.prototype._addBelongsTo = function (slave, master, name) {
            var masters;
            var names;
            if (this._belongsTo.has(slave)) {
                masters = this._belongsTo.get(slave);
                names = this._belongsToName.get(slave);
            } else {
                masters = new shim_1.Set();
                names = new shim_1.Map();
                this._belongsTo.set(slave, masters);
                this._belongsToName.set(slave, names);
            }
            masters.add(master);
            names.set(master, name);
        };    /**
         * Удаляет отношение вида belongsTo
         * @param {Object} master Главная сущность
         * @param {Object} slave Зависимая сущность
         * @protected
         */
        /**
         * Удаляет отношение вида belongsTo
         * @param {Object} master Главная сущность
         * @param {Object} slave Зависимая сущность
         * @protected
         */
        ManyToMany.prototype._removeBelongsTo = function (slave, master) {
            if (this._belongsTo.has(slave)) {
                var masters = this._belongsTo.get(slave);
                masters.delete(master);
                this._belongsToName.get(slave).delete(master);
                if (masters.size === 0) {
                    this._belongsTo.delete(slave);
                    this._belongsToName.delete(slave);
                }
            }
        };
        return ManyToMany;
    }(DestroyableMixin_1.default    /** @lends Types/_entity/relation/ManyToMany.prototype */);
    /** @lends Types/_entity/relation/ManyToMany.prototype */
    exports.default = ManyToMany;
    ManyToMany.prototype['[Types/_entity/relation/ManyToMany]'] = true;
    ManyToMany.prototype._hasMany = null;
    ManyToMany.prototype._hasManyName = null;
    ManyToMany.prototype._belongsTo = null;
    ManyToMany.prototype._belongsToName = null;
});