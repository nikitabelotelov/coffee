/// <amd-module name="Types/_source/Query" />
/**
 * Запрос на выборку.
 *
 * Выберем 100 заказов за последние сутки и отсортируем их по возрастанию номера:
 * <pre>
 *    require(['Types/source'], function (source) {
 *       var query = new source.Query(),
 *          date = new Date();
 *
 *       date.setDate(date.getDate() - 1);
 *
 *       query
 *          .select(['id', 'date', 'customerId'])
 *          .from('Orders')
 *          .where(function(order) {
 *             return order.date - date >= 0;
 *          })
 *          .orderBy('id')
 *          .limit(100);
 *    });
 * </pre>
 * @class Types/_source/Query
 * @implements Types/_entity/ICloneable
 * @mixes Types/_entity/OptionsMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_source/Query', [
    'require',
    'exports',
    'tslib',
    'Types/entity',
    'Types/util'
], function (require, exports, tslib_1, entity_1, util_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var ExpandMode;
    (function (ExpandMode) {
        ExpandMode[ExpandMode['None'] = 0] = 'None';
        ExpandMode[ExpandMode['Nodes'] = 1] = 'Nodes';
        ExpandMode[ExpandMode['Leaves'] = 2] = 'Leaves';
        ExpandMode[ExpandMode['All'] = 3] = 'All';
    }(ExpandMode = exports.ExpandMode || (exports.ExpandMode = {})));    /**
     * Clones object
     * @param data Object to clone
     * @return {Object}
     */
    /**
     * Clones object
     * @param data Object to clone
     * @return {Object}
     */
    function duplicate(data) {
        if (data['[Types/_entity/ICloneable]']) {
            return data.clone();
        }
        if (data && typeof data === 'object') {
            return tslib_1.__assign({}, data);
        }
        return data;
    }    /**
     * Parses expression from fields set
     * @param expression Expression with fields set
     * @return {Object}
     */
    /**
     * Parses expression from fields set
     * @param expression Expression with fields set
     * @return {Object}
     */
    function parseSelectExpression(expression) {
        if (typeof expression === 'string') {
            expression = expression.split(/[ ,]/);
        }
        if (expression instanceof Array) {
            var orig = expression;
            expression = {};
            for (var i = 0; i < orig.length; i++) {
                expression[orig[i]] = orig[i];
            }
        }
        if (typeof expression !== 'object') {
            throw new TypeError('Invalid argument "expression"');
        }
        return expression;
    }    /**
     * Объект, задающий способ объединения множеств.
     * @class Types/_source/Query/Join
     * @mixes Types/_entity/OptionsMixin
     * @public
     */
    /**
     * Объект, задающий способ объединения множеств.
     * @class Types/_source/Query/Join
     * @mixes Types/_entity/OptionsMixin
     * @public
     */
    var Join = /** @class */
    function (_super) {
        tslib_1.__extends(Join, _super);
        function Join(options) {
            var _this = _super.call(this) || this;    /**
             * @cfg {String} Правое множество
             * @name Types/_source/Query/Join#resource
             */
            /**
             * @cfg {String} Правое множество
             * @name Types/_source/Query/Join#resource
             */
            _this._$resource = '';    /**
             * @cfg {String} Синоним правого множества
             * @name Types/_source/Query/Join#as
             */
            /**
             * @cfg {String} Синоним правого множества
             * @name Types/_source/Query/Join#as
             */
            _this._$as = '';    /**
             * @cfg {Object} Правило объединения
             * @name Types/_source/_source/Query/Join#on
             */
            /**
             * @cfg {Object} Правило объединения
             * @name Types/_source/_source/Query/Join#on
             */
            _this._$on = {};    /**
             * @cfg {Object} Выбираемые поля
             * @name Types/_source/Query/Join#select
             */
            /**
             * @cfg {Object} Выбираемые поля
             * @name Types/_source/Query/Join#select
             */
            _this._$select = {};    /**
             * @cfg {Boolean} Внутреннее объединение
             * @name Types/_source/Query/Join#inner
             */
            /**
             * @cfg {Boolean} Внутреннее объединение
             * @name Types/_source/Query/Join#inner
             */
            _this._$inner = true;
            entity_1.OptionsToPropertyMixin.call(_this, options);
            return _this;
        }    /**
         * Возвращает правое множество
         * @return {String}
         */
        /**
         * Возвращает правое множество
         * @return {String}
         */
        Join.prototype.getResource = function () {
            return this._$resource;
        };    /**
         * Возвращает синоним правого множества
         * @return {String}
         */
        /**
         * Возвращает синоним правого множества
         * @return {String}
         */
        Join.prototype.getAs = function () {
            return this._$as;
        };    /**
         * Возвращает правило объеднения
         * @return {Object}
         */
        /**
         * Возвращает правило объеднения
         * @return {Object}
         */
        Join.prototype.getOn = function () {
            return this._$on;
        };    /**
         * Возвращает правило объеднения
         * @return {Object}
         */
        /**
         * Возвращает правило объеднения
         * @return {Object}
         */
        Join.prototype.getSelect = function () {
            return this._$select;
        };    /**
         * Это внутреннее объединение
         * @return {Boolean}
         */
        /**
         * Это внутреннее объединение
         * @return {Boolean}
         */
        Join.prototype.isInner = function () {
            return this._$inner;
        };
        return Join;
    }(util_1.mixin(Object, entity_1.OptionsToPropertyMixin));
    exports.Join = Join;    /**
     * Объект, задающий способ сортировки множества
     * @class Types/_source/Query/Order
     * @mixes Types/_entity/OptionsMixin
     * @public
     */
    /**
     * Объект, задающий способ сортировки множества
     * @class Types/_source/Query/Order
     * @mixes Types/_entity/OptionsMixin
     * @public
     */
    var Order = /** @class */
    function (_super) {
        tslib_1.__extends(Order, _super);
        function Order(options) {
            var _this = _super.call(this) || this;    /**
             * @typedef {Boolean} Order
             * @variant false По возрастанию
             * @variant true По убыванию
             */
                                                      /**
             * @cfg {String} Объект сортировки
             * @name Types/_source/Query/Order#selector
             */
            /**
             * @typedef {Boolean} Order
             * @variant false По возрастанию
             * @variant true По убыванию
             */
            /**
             * @cfg {String} Объект сортировки
             * @name Types/_source/Query/Order#selector
             */
            _this._$selector = '';    /**
             * @cfg {Order} Порядок сортировки
             * @name Types/_source/Query/Order#order
             */
            /**
             * @cfg {Order} Порядок сортировки
             * @name Types/_source/Query/Order#order
             */
            _this._$order = false;
            entity_1.OptionsToPropertyMixin.call(_this, options);
            var order = _this._$order;
            if (typeof order === 'string') {
                order = order.toUpperCase();
            }
            switch (order) {
            case Order.SORT_DESC:
            case Order.SORT_DESC_STR:
                _this._$order = Order.SORT_DESC;
                break;
            default:
                _this._$order = Order.SORT_ASC;
            }
            return _this;
        }    /**
         * Возвращает Объект сортировки
         * @return {String}
         */
        /**
         * Возвращает Объект сортировки
         * @return {String}
         */
        Order.prototype.getSelector = function () {
            return this._$selector;
        };    /**
         * Возвращает порядок сортировки
         * @return {Order}
         */
        /**
         * Возвращает порядок сортировки
         * @return {Order}
         */
        Order.prototype.getOrder = function () {
            return this._$order;
        };
        Object.defineProperty(Order, 'SORT_ASC', {
            //region Static
            /**
             * Сортировка по возрастанию
             */
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Order, 'SORT_DESC', {
            /**
             * Сортировка по убыванию
             */
            get: function () {
                return true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Order, 'SORT_ASC_STR', {
            /**
             * Сортировка по возрастанию (для строки)
             */
            get: function () {
                return 'ASC';
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Order, 'SORT_DESC_STR', {
            /**
             * Сортировка по убыванию (для строки)
             */
            get: function () {
                return 'DESC';
            },
            enumerable: true,
            configurable: true
        });
        return Order;
    }(util_1.mixin(Object, entity_1.OptionsToPropertyMixin));
    exports.Order = Order;    /**
     * Query implementation
     */
    /**
     * Query implementation
     */
    var Query = /** @class */
    function (_super) {
        tslib_1.__extends(Query, _super);
        function Query(options) {
            var _this = _super.call(this) || this;    /**
             * Выбираемые поля
             */
            /**
             * Выбираемые поля
             */
            _this._select = {};    /**
             * Объект выборки
             */
            /**
             * Объект выборки
             */
            _this._from = '';    /**
             * Псеводним объекта выборки
             */
            /**
             * Псеводним объекта выборки
             */
            _this._as = '';    /**
             * Объединения с другими выборками
             */
            /**
             * Объединения с другими выборками
             */
            _this._join = [];    /**
             * Способ фильтрации
             */
            /**
             * Способ фильтрации
             */
            _this._where = {};    /**
             * Способ группировки
             */
            /**
             * Способ группировки
             */
            _this._groupBy = [];    /**
             * Способы сортировки
             */
            /**
             * Способы сортировки
             */
            _this._orderBy = [];    /**
             * Смещение
             */
            /**
             * Смещение
             */
            _this._offset = 0;    /**
             * Максимальное кол-во записей
             */
            /**
             * Максимальное кол-во записей
             */
            _this._limit = undefined;    /**
             * Мета-данные запроса
             */
            /**
             * Мета-данные запроса
             */
            _this._meta = {};    //region ICloneable
            //region ICloneable
            _this['[Types/_entity/ICloneable]'] = true;
            entity_1.OptionsToPropertyMixin.call(_this, options);
            return _this;
        }
        Query.prototype.clone = function () {
            // TODO: deeper clone?
            var clone = new Query();
            clone._select = duplicate(this._select);
            clone._from = this._from;
            clone._as = this._as;
            clone._join = this._join.slice();
            clone._where = duplicate(this._where);
            clone._groupBy = this._groupBy.slice();
            clone._orderBy = this._orderBy.slice();
            clone._offset = this._offset;
            clone._limit = this._limit;
            clone._meta = duplicate(this._meta);
            return clone;
        };    //endregion ICloneable
              //region Public methods
              /**
         * Сбрасывает все параметры запроса
         * @return {Types/_source/Query}
         */
        //endregion ICloneable
        //region Public methods
        /**
         * Сбрасывает все параметры запроса
         * @return {Types/_source/Query}
         */
        Query.prototype.clear = function () {
            this._select = {};
            this._from = '';
            this._as = '';
            this._join = [];
            this._where = {};
            this._groupBy = [];
            this._orderBy = [];
            this._offset = 0;
            this._limit = undefined;
            this._meta = {};
            return this;
        };    /**
         * Возвращает поля выборки
         * @return {Object.<String>}
         * @example
         * Получим поля выборки:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select(['id', 'date']);
         *       console.log(query.getSelect());//{id: 'id', date: 'date'}
         *    });
         * </pre>
         */
        /**
         * Возвращает поля выборки
         * @return {Object.<String>}
         * @example
         * Получим поля выборки:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select(['id', 'date']);
         *       console.log(query.getSelect());//{id: 'id', date: 'date'}
         *    });
         * </pre>
         */
        Query.prototype.getSelect = function () {
            return this._select;
        };    /**
         * Устанавливает поля выборки
         * @param {Array.<String>|Object.<String>|String} expression Выбираемые поля
         * @return {Types/_source/Query}
         * @example
         * Выбираем все заказы с определенным набором полей:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select(['id', 'date', 'customerId' ])
         *          .from('Orders');
         *    });
         * </pre>
         * Выбираем все заказы со всеми полями:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders');
         *    });
         * </pre>
         */
        /**
         * Устанавливает поля выборки
         * @param {Array.<String>|Object.<String>|String} expression Выбираемые поля
         * @return {Types/_source/Query}
         * @example
         * Выбираем все заказы с определенным набором полей:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select(['id', 'date', 'customerId' ])
         *          .from('Orders');
         *    });
         * </pre>
         * Выбираем все заказы со всеми полями:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders');
         *    });
         * </pre>
         */
        Query.prototype.select = function (expression) {
            this._select = parseSelectExpression(expression);
            return this;
        };    /**
         * Возвращает объект выборки
         * @return {String}
         * @example
         * Получим объект выборки:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select(['id', 'date'])
         *          .from('Orders');
         *       console.log(query.getFrom());//'Orders'
         *    });
         * </pre>
         */
        /**
         * Возвращает объект выборки
         * @return {String}
         * @example
         * Получим объект выборки:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select(['id', 'date'])
         *          .from('Orders');
         *       console.log(query.getFrom());//'Orders'
         *    });
         * </pre>
         */
        Query.prototype.getFrom = function () {
            return this._from;
        };    /**
         * Возвращает псеводним выборки
         * @return {String}
         * @example
         * Получим псеводним выборки:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select(['id', 'date'])
         *          .from('Orders', 'o');
         *       console.log(query.getAs());//'o'
         *    });
         * </pre>
         */
        /**
         * Возвращает псеводним выборки
         * @return {String}
         * @example
         * Получим псеводним выборки:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select(['id', 'date'])
         *          .from('Orders', 'o');
         *       console.log(query.getAs());//'o'
         *    });
         * </pre>
         */
        Query.prototype.getAs = function () {
            return this._as;
        };    /**
         * Устанавливает объект выборки
         * @param {String} resource Объект выборки
         * @param {String} [as] Псеводним объекта выборки
         * @return {Types/_source/Query}
         * @example
         * Выбираем заказы с указанием полей через псеводним:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select(['o.id', 'o.date', 'o.customerId'])
         *          .from('Orders', 'o');
         *    });
         * </pre>
         */
        /**
         * Устанавливает объект выборки
         * @param {String} resource Объект выборки
         * @param {String} [as] Псеводним объекта выборки
         * @return {Types/_source/Query}
         * @example
         * Выбираем заказы с указанием полей через псеводним:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select(['o.id', 'o.date', 'o.customerId'])
         *          .from('Orders', 'o');
         *    });
         * </pre>
         */
        Query.prototype.from = function (resource, as) {
            this._from = resource;
            this._as = as;
            return this;
        };    /**
         * Возвращает способы объединения
         * @return {Types/_source/Query/Join[]}
         * @example
         * Получим способ объединения c объектом Customers:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .join(
         *             'Customers',
         *             {id: 'customerId'},
         *             ['name', 'email']
         *          );
         *
         *       var join = query.getJoin()[0];
         *       console.log(join.getResource());//'Customers'
         *       console.log(join.getSelect());//{name: 'name', email: 'email'}
         *    });
         * </pre>
         */
        /**
         * Возвращает способы объединения
         * @return {Types/_source/Query/Join[]}
         * @example
         * Получим способ объединения c объектом Customers:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .join(
         *             'Customers',
         *             {id: 'customerId'},
         *             ['name', 'email']
         *          );
         *
         *       var join = query.getJoin()[0];
         *       console.log(join.getResource());//'Customers'
         *       console.log(join.getSelect());//{name: 'name', email: 'email'}
         *    });
         * </pre>
         */
        Query.prototype.getJoin = function () {
            return this._join;
        };    /**
         * Устанавливает объединение выборки с другой выборкой
         * @param {String|Array} resource Объект выборки для объединения и его псеводним
         * @param {Object} on Правило объединения
         * @param {Object|Array|String} expression Выбираемые поля
         * @param {Boolean} [inner=true] Внутреннее или внешнее объединение
         * @return {Types/_source/Query}
         * @example
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .join(
         *             'Customers',
         *             {id: 'customerId'},
         *             '*'
         *          );
         *
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .join(
         *             'Customers',
         *             {id: 'customerId'},
         *             {customerName: 'name', customerEmail: 'email'}
         *          );
         *    });
         * </pre>
         */
        /**
         * Устанавливает объединение выборки с другой выборкой
         * @param {String|Array} resource Объект выборки для объединения и его псеводним
         * @param {Object} on Правило объединения
         * @param {Object|Array|String} expression Выбираемые поля
         * @param {Boolean} [inner=true] Внутреннее или внешнее объединение
         * @return {Types/_source/Query}
         * @example
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .join(
         *             'Customers',
         *             {id: 'customerId'},
         *             '*'
         *          );
         *
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .join(
         *             'Customers',
         *             {id: 'customerId'},
         *             {customerName: 'name', customerEmail: 'email'}
         *          );
         *    });
         * </pre>
         */
        Query.prototype.join = function (resource, on, expression, inner) {
            if (typeof resource === 'string') {
                resource = resource.split(' ');
            }
            if (!(resource instanceof Array)) {
                throw new Error('Invalid argument "resource"');
            }
            this._join.push(new Join({
                resource: resource.shift(),
                as: resource.shift() || '',
                on: on,
                select: parseSelectExpression(expression),
                inner: inner === undefined ? true : inner
            }));
            return this;
        };    /**
         * Возвращает способ фильтрации
         * @return {Object.<String>|Function(*, Number):Boolean}
         * @example
         * Получим способ фильтрации выборки:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .where({host: 'my.store.com'});
         *
         *       console.log(query.getWhere());//{'host': 'my.store.com'}
         *    });
         * </pre>
         */
        /**
         * Возвращает способ фильтрации
         * @return {Object.<String>|Function(*, Number):Boolean}
         * @example
         * Получим способ фильтрации выборки:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .where({host: 'my.store.com'});
         *
         *       console.log(query.getWhere());//{'host': 'my.store.com'}
         *    });
         * </pre>
         */
        Query.prototype.getWhere = function () {
            return this._where;
        };    /**
         * Устанавливает фильтр выборки.
         * @remark
         * Если expression передан в виде функции, то она принимает аргументы: элемент коллекции и его порядковый номер.
         * @param {Object.<String>|Function(*, Number): Boolean} expression Условие фильтрации
         * @return {Types/_source/Query}
         * @example
         * Выберем рейсы, приземлившиеся в аэропорту "Шереметьево", прибывшие из Нью-Йорка или Лос-Анджелеса:
         * <pre>
         *    var query = new Query()
         *       .select('*')
         *       .from('AirportsSchedule')
         *       .where({
         *          iata: 'SVO',
         *          direction: 'Arrivals',
         *          state: 'Landed',
         *          fromCity: ['New York', 'Los Angeles']
         *       });
         * </pre>
         * Выберем все заказы с номером больше 10, сделанные до текущего момента:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .where(function(order) {
         *             return order.id > 10 && Number(order.date) < Date.now();
         *          });
         *    });
         * </pre>
         */
        /**
         * Устанавливает фильтр выборки.
         * @remark
         * Если expression передан в виде функции, то она принимает аргументы: элемент коллекции и его порядковый номер.
         * @param {Object.<String>|Function(*, Number): Boolean} expression Условие фильтрации
         * @return {Types/_source/Query}
         * @example
         * Выберем рейсы, приземлившиеся в аэропорту "Шереметьево", прибывшие из Нью-Йорка или Лос-Анджелеса:
         * <pre>
         *    var query = new Query()
         *       .select('*')
         *       .from('AirportsSchedule')
         *       .where({
         *          iata: 'SVO',
         *          direction: 'Arrivals',
         *          state: 'Landed',
         *          fromCity: ['New York', 'Los Angeles']
         *       });
         * </pre>
         * Выберем все заказы с номером больше 10, сделанные до текущего момента:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .where(function(order) {
         *             return order.id > 10 && Number(order.date) < Date.now();
         *          });
         *    });
         * </pre>
         */
        Query.prototype.where = function (expression) {
            expression = expression || {};
            var type = typeof expression;
            if (type !== 'object' && type !== 'function') {
                throw new TypeError('Invalid argument "expression"');
            }
            this._where = expression;
            return this;
        };    /**
         * Возвращает способы сортировки
         * @return {Array.<Types/_source/Query/Order>}
         * @example
         * Получим способы сортировки выборки:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .orderBy('id');
         *
         *       var order = query.getOrderBy()[0];
         *       console.log(order.getSelector());//'id'
         *       console.log(order.getOrder());//false
         *    });
         * </pre>
         */
        /**
         * Возвращает способы сортировки
         * @return {Array.<Types/_source/Query/Order>}
         * @example
         * Получим способы сортировки выборки:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .orderBy('id');
         *
         *       var order = query.getOrderBy()[0];
         *       console.log(order.getSelector());//'id'
         *       console.log(order.getOrder());//false
         *    });
         * </pre>
         */
        Query.prototype.getOrderBy = function () {
            return this._orderBy;
        };    /**
         * Устанавливает порядок сортировки выборки
         * @param {String|Array.<Object.<Types/_source/Query/Order.typedef>>} selector Название поле сортировки или набор
         * полей и направление сортировки в каждом (false - по возрастанию, true - по убыванию)
         * @param {Types/_source/Query/Order.typedef} [desc=false] По убыванию
         * @return {Types/_source/Query}
         * @example
         * Отсортируем заказы по полю id по возрастанию:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .orderBy('id');
         *    });
         * </pre>
         * Отсортируем заказы по полю id по убыванию:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .orderBy('id', true);
         *    });
         * </pre>
         * Отсортируем заказы сначала по полю customerId по возрастанию, затем по полю date по убыванию:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .orderBy([
         *             {customerId: false},
         *             {date: true}
         *          ]);
         *    });
         * </pre>
         */
        /**
         * Устанавливает порядок сортировки выборки
         * @param {String|Array.<Object.<Types/_source/Query/Order.typedef>>} selector Название поле сортировки или набор
         * полей и направление сортировки в каждом (false - по возрастанию, true - по убыванию)
         * @param {Types/_source/Query/Order.typedef} [desc=false] По убыванию
         * @return {Types/_source/Query}
         * @example
         * Отсортируем заказы по полю id по возрастанию:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .orderBy('id');
         *    });
         * </pre>
         * Отсортируем заказы по полю id по убыванию:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .orderBy('id', true);
         *    });
         * </pre>
         * Отсортируем заказы сначала по полю customerId по возрастанию, затем по полю date по убыванию:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .orderBy([
         *             {customerId: false},
         *             {date: true}
         *          ]);
         *    });
         * </pre>
         */
        Query.prototype.orderBy = function (selector, desc) {
            var _this = this;
            if (desc === undefined) {
                desc = true;
            }
            this._orderBy = [];
            if (typeof selector === 'object') {
                var processObject = function (obj) {
                    if (!obj) {
                        return;
                    }
                    for (var key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            _this._orderBy.push(new Order({
                                selector: key,
                                order: obj[key]
                            }));
                        }
                    }
                };
                if (selector instanceof Array) {
                    for (var i = 0; i < selector.length; i++) {
                        processObject(selector[i]);
                    }
                } else {
                    processObject(selector);
                }
            } else if (selector) {
                this._orderBy.push(new Order({
                    selector: selector,
                    order: desc
                }));
            }
            return this;
        };    /**
         * Возвращает способ группировки
         * @return {Array.<String>}
         * @example
         * Получим способ группировки выборки:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .groupBy('customerId');
         *
         *       console.log(query.getGroupBy());//['customerId']
         *    });
         * </pre>
         */
        /**
         * Возвращает способ группировки
         * @return {Array.<String>}
         * @example
         * Получим способ группировки выборки:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .groupBy('customerId');
         *
         *       console.log(query.getGroupBy());//['customerId']
         *    });
         * </pre>
         */
        Query.prototype.getGroupBy = function () {
            return this._groupBy;
        };    /**
         * Устанавливает способ группировки выборки
         * @param {String|Array.<String>} expression Способ группировки элементов
         * @return {Types/_source/Query}
         * @example
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .groupBy('customerId');
         *
         *       var query = new Query()
         *          .select('*')
         *          .from('Orders')
         *          .groupBy(['date', 'customerId']);
         *    });
         * </pre>
         */
        /**
         * Устанавливает способ группировки выборки
         * @param {String|Array.<String>} expression Способ группировки элементов
         * @return {Types/_source/Query}
         * @example
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .groupBy('customerId');
         *
         *       var query = new Query()
         *          .select('*')
         *          .from('Orders')
         *          .groupBy(['date', 'customerId']);
         *    });
         * </pre>
         */
        Query.prototype.groupBy = function (expression) {
            if (typeof expression === 'string') {
                expression = [expression];
            }
            if (!(expression instanceof Array)) {
                throw new Error('Invalid argument');
            }
            this._groupBy = expression;
            return this;
        };    /**
         * Возвращает смещение
         * @return {Number}
         * @example
         * Получим смещение выборки:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .offset(50);
         *
         *       query.getOffset();//50
         *    });
         * </pre>
         */
        /**
         * Возвращает смещение
         * @return {Number}
         * @example
         * Получим смещение выборки:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .offset(50);
         *
         *       query.getOffset();//50
         *    });
         * </pre>
         */
        Query.prototype.getOffset = function () {
            return this._offset;
        };    /**
         * Устанавливает смещение первого элемента выборки
         * @param {Number} start Смещение первого элемента выборки
         * @return {Types/_source/Query}
         * @example
         * Выберем все заказы, начиная с пятидесятого:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .offset(50);
         *    });
         * </pre>
         */
        /**
         * Устанавливает смещение первого элемента выборки
         * @param {Number} start Смещение первого элемента выборки
         * @return {Types/_source/Query}
         * @example
         * Выберем все заказы, начиная с пятидесятого:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .offset(50);
         *    });
         * </pre>
         */
        Query.prototype.offset = function (start) {
            this._offset = parseInt(start, 10) || 0;
            return this;
        };    /**
         * Возвращает максимальное количество записей выборки
         * @return {Number}
         * @example
         * Получим максимальное количество записей выборки:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .limit(10);
         *
         *       console.log(query.getLimit());//10
         *    });
         * </pre>
         */
        /**
         * Возвращает максимальное количество записей выборки
         * @return {Number}
         * @example
         * Получим максимальное количество записей выборки:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .limit(10);
         *
         *       console.log(query.getLimit());//10
         *    });
         * </pre>
         */
        Query.prototype.getLimit = function () {
            return this._limit;
        };    /**
         * Устанавливает ограничение кол-ва элементов выборки
         * @param {Number} count Максимальное кол-во элементов выборки
         * @return {Types/_source/Query}
         * @example
         * Выберем первые десять заказов:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .limit(10);
         *    });
         * </pre>
         */
        /**
         * Устанавливает ограничение кол-ва элементов выборки
         * @param {Number} count Максимальное кол-во элементов выборки
         * @return {Types/_source/Query}
         * @example
         * Выберем первые десять заказов:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Orders')
         *          .limit(10);
         *    });
         * </pre>
         */
        Query.prototype.limit = function (count) {
            this._limit = count;
            return this;
        };    /**
         * Возвращает мета-данные выборки
         * @return {Object}
         * @example
         * Получим мета-данные выборки:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Catalogue')
         *          .meta({selectBreadCrumbs: true});
         *
         *       console.log(query.getMeta());//{selectBreadCrumbs: true}
         *    });
         * </pre>
         */
        /**
         * Возвращает мета-данные выборки
         * @return {Object}
         * @example
         * Получим мета-данные выборки:
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Catalogue')
         *          .meta({selectBreadCrumbs: true});
         *
         *       console.log(query.getMeta());//{selectBreadCrumbs: true}
         *    });
         * </pre>
         */
        Query.prototype.getMeta = function () {
            return this._meta;
        };    /**
         * Устанавливает мета-данные выборки
         * @param {Object} data Мета-данные
         * @return {Types/_source/Query}
         * @example
         * Укажем, что в результатах запроса хочем дополнительно получить "хлебные крошки":
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Catalogue')
         *          .where({'parentId': 10})
         *          .meta({selectBreadCrumbs: true});
         *    });
         * </pre>
         */
        /**
         * Устанавливает мета-данные выборки
         * @param {Object} data Мета-данные
         * @return {Types/_source/Query}
         * @example
         * Укажем, что в результатах запроса хочем дополнительно получить "хлебные крошки":
         * <pre>
         *    require(['Types/source'], function (source) {
         *       var query = new source.Query()
         *          .select('*')
         *          .from('Catalogue')
         *          .where({'parentId': 10})
         *          .meta({selectBreadCrumbs: true});
         *    });
         * </pre>
         */
        Query.prototype.meta = function (data) {
            data = data || {};
            if (typeof data !== 'object') {
                throw new TypeError('Invalid argument "data"');
            }
            this._meta = data;
            return this;
        };
        return Query;
    }(util_1.mixin(Object, entity_1.OptionsToPropertyMixin));
    exports.default = Query;
    Query.prototype._moduleName = 'Types/source:Query';
    Query.prototype['[Types/_source/Query]'] = true;
});