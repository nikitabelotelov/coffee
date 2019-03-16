/// <amd-module name="Types/_entity/ManyToManyMixin" />
/**
 * Миксин, позволяющий сущности строить отношения "многие ко многим"
 * @mixin Types/_entity/ManyToManyMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/ManyToManyMixin', [
    'require',
    'exports',
    'Types/_entity/relation/ManyToMany'
], function (require, exports, ManyToMany_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var ManyToManyMixin = /** @lends Types/_entity/ManyToManyMixin.prototype */
    {
        '[Types/_entity/ManyToManyMixin]': true,
        // FIXME: backward compatibility for check via Core/core-instance::instanceOfMixin()
        '[WS.Data/Entity/ManyToManyMixin]': true,
        /**
         * @property {Types/_entity/relation/ManyToMany} Медиатор, отвечающий за связи между сущностями
         */
        _mediator: null,
        // region Public methods
        destroy: function () {
            var mediator = this._getMediator();
            var slaves = [];
            mediator.hasMany(this, function (slave) {
                slaves.push(slave);
            });
            mediator.clear(this);
            var slave;
            for (var i = 0, count = slaves.length; i < count; i++) {
                slave = slaves[i];
                if (slave.destroy && !slave.destroyed) {
                    slave.destroy();
                }
            }
            this._setMediator(null);
        },
        // endregion Public methods
        // region Protected methods
        /**
         * Добавляет отношение с другой сущностью
         * @param {Types/_entity/relation/IReceiver} child Другая сущность
         * @param {String} [name] Название отношения
         * @protected
         */
        _addChild: function (child, name) {
            if (child instanceof Object) {
                var mediator = this._getMediator();
                mediator.addRelationship(this, child, name);
                if (child['[Types/_entity/ManyToManyMixin]'] && !child._hasSameMediator(mediator)) {
                    if (!child._hasMediator()) {
                        child._setMediator(this._createMediator());
                    }
                    child._getMediator().addRelationship(this, child, name);
                }
            }
        },
        /**
         * Удаляет отношение с другой сущностью
         * @param {Types/_entity/relation/IReceiver} child Другая сущность
         * @protected
         */
        _removeChild: function (child) {
            if (child instanceof Object) {
                var mediator = this._getMediator();
                mediator.removeRelationship(this, child);
                if (child['[Types/_entity/ManyToManyMixin]'] && child._hasMediator() && !child._hasSameMediator(mediator)) {
                    child._getMediator().removeRelationship(this, child);
                }
            }
        },
        /**
         * Уведомляет дочерние сущности об изменении родительской
         * @param {*} [data] Данные об изменениях
         * @protected
         */
        _parentChanged: function (data) {
            var which = {
                target: this,
                data: data,
                original: data
            };
            this._getMediator().hasMany(this, function (slave, name) {
                if (slave['[Types/_entity/relation/IReceiver]']) {
                    slave.relationChanged(which, [name]);
                }
            });
        },
        /**
         * Рекурсивно уведомляет родительские сущности об изменении дочерней
         * @param {*} [data] Данные об изменениях
         * @protected
         */
        _childChanged: function (data) {
            var original = data;
            var notifyParent = function (mediator, child, route) {
                mediator.belongsTo(child, function (parent, name) {
                    var childRoute = route.slice(), which = {
                            target: child,
                            data: data,
                            original: original
                        }, parentWhich;
                    childRoute.unshift(name);
                    if (parent['[Types/_entity/relation/IReceiver]']) {
                        parentWhich = parent.relationChanged(which, childRoute);    // Replace data with parent's data
                        // Replace data with parent's data
                        if (parentWhich !== undefined) {
                            data = parentWhich.data;
                        }
                    }
                    notifyParent(parent._getMediator(), parent, childRoute);
                });
            };
            notifyParent(this._getMediator(), this, []);
        },
        /**
         * Возвращает признак наличия посредника
         * @return {Boolean}
         * @protected
         */
        _hasMediator: function () {
            return !!this._mediator;
        },
        /**
         * Возвращает признак наличия одинакового посредника
         * @param {Types/_entity/relation/ManyToMany} mediator
         * @return {Boolean}
         * @protected
         */
        _hasSameMediator: function (mediator) {
            return this._mediator === mediator;
        },
        /**
         * Создает посредника для установления отношений с детьми
         * @return {Types/_entity/relation/ManyToMany}
         * @protected
         */
        _createMediator: function () {
            return new ManyToMany_1.default();
        },
        /**
         * Возвращает посредника для установления отношений с детьми
         * @return {Types/_entity/relation/ManyToMany}
         * @protected
         */
        _getMediator: function () {
            return this._mediator || (this._mediator = this._createMediator());
        },
        /**
         * Устанавливает посредника для установления отношений с детьми
         * @param {Types/_entity/relation/ManyToMany|null} mediator
         * @protected
         */
        _setMediator: function (mediator) {
            this._mediator = mediator;
        }    // endregion Protected methods
    };
    // endregion Protected methods
    exports.default = ManyToManyMixin;
});