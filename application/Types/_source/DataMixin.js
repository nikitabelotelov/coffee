/// <amd-module name="Types/_source/DataMixin" />
/**
 * Миксин, позволяющий реализовать интерфейс {@link Types/Source/IData}.
 * @mixin Types/Source/DataMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_source/DataMixin', [
    'require',
    'exports',
    'Types/entity',
    'Types/di'
], function (require, exports, entity_1, di_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var DataMixin = /** @lends Types/Source/DataMixin.prototype */
    {
        '[Types/_source/DataMixin]': true,
        /**
         * @cfg {String|Types/Adapter/IAdapter} Адаптер для работы с форматом данных, выдаваемых источником. По умолчанию {@link Types/Adapter/Json}.
         * @name Types/Source/DataMixin#adapter
         * @see getAdapter
         * @see Types/Adapter/IAdapter
         * @see Types/Di
         * @example
         * Адаптер для данных в формате БЛ СБИС, внедренный в виде готового экземпляра:
         * <pre>
         *    require([
         *       'Types/Source/Provider/SbisBusinessLogic',
         *       'Types/Source/Memory',
         *       'Types/Adapter/Sbis'
         *    ], function (Provider, MemorySource, SbisAdapter) {
         *       new Provider({
         *          address: '/service/',
         *          contract: 'Employee'
         *       })
         *       .call('getList', {department: 'Management'})
         *       .addCallbacks(function(data) {
         *          var dataSource = new MemorySource({
         *             adapter: new SbisAdapter(),
         *             data: data
         *          });
         *       }, function(error) {
         *          console.error('Can\'t call "Employee::getList"', error);
         *       });
         *    });
         * </pre>
         * Адаптер для данных в формате БЛ СБИС, внедренный в виде названия зарегистрированной зависимости:
         * <pre>
         *    require([
         *       'Types/Source/Provider/SbisBusinessLogic',
         *       'Types/Source/Memory',
         *       'Types/Adapter/Sbis'
         *    ], function (Provider, MemorySource) {
         *       new Provider({
         *          address: '/service/',
         *          contract: 'Employee'
         *       })
         *       .call('getList', {department: 'Management'})
         *       .addCallbacks(function(data) {
         *          var dataSource = new MemorySource({
         *             adapter: 'Types/entity:adapter.Sbis',
         *             data: data
         *          });
         *       }, function(error) {
         *          console.error('Can\'t call "Employee::getList"', error);
         *       });
         *    });
         * </pre>
         */
        _$adapter: 'Types/entity:adapter.Json',
        /**
         * @cfg {String|Function} Конструктор записей, порождаемых источником данных. По умолчанию {@link Types/Entity/Model}.
         * @name Types/Source/DataMixin#model
         * @see getModel
         * @see Types/Entity/Model
         * @see Types/Di
         * @example
         * Конструктор пользовательской модели, внедренный в виде класса:
         * <pre>
         *    var User = Model.extend({
         *       identify: function(login, password) {
         *       }
         *    });
         *    //...
         *    var dataSource = new MemorySource({
         *       model: User
         *    });
         * </pre>
         * Конструктор пользовательской модели, внедренный в виде названия зарегистрированной зависимости:
         * <pre>
         *    var User = Model.extend({
         *       identify: function(login, password) {
         *       }
         *    });
         *    Di.register('app.model.user', User);
         *    //...
         *    var dataSource = new MemorySource({
         *       model: 'app.model.user'
         *    });
         * </pre>
         */
        _$model: 'Types/entity:Model',
        /**
         * @cfg {String|Function} Конструктор рекордсетов, порождаемых источником данных. По умолчанию {@link Types/Collection/RecordSet}.
         * @name Types/Source/DataMixin#listModule
         * @see getListModule
         * @see Types/Collection/RecordSet
         * @see Types/Di
         * @example
         * Конструктор рекордсета, внедренный в виде класса:
         * <pre>
         *    var Users = RecordSet.extend({
         *       getAdministrators: function() {
         *       }
         *    });
         *    //...
         *    var dataSource = new MemorySource({
         *       listModule: Users
         *    });
         * </pre>
         * Конструктор рекордсета, внедренный в виде названия зарегистрированной зависимости:
         * <pre>
         *    var Users = RecordSet.extend({
         *       getAdministrators: function() {
         *       }
         *    });
         *    Di.register('app.collections.users', Users);
         *    //...
         *    var dataSource = new MemorySource({
         *       listModule: 'app.collections.users'
         *    });
         * </pre>
         */
        _$listModule: 'Types/collection:RecordSet',
        /**
         * @cfg {String} Название свойства записи, содержащего первичный ключ.
         * @name Types/Source/DataMixin#idProperty
         * @see getIdProperty
         * @see Types/Entity/Model#idProperty
         * @example
         * Установим свойство 'primaryId' в качестве первичного ключа:
         * <pre>
         *    var dataSource = new MemorySource({
         *       idProperty: 'primaryId'
         *    });
         * </pre>
         */
        _$idProperty: '',
        /**
         * @member {String|Function} Конструктор модуля, реализующего DataSet
         */
        _dataSetModule: 'Types/source:DataSet',
        /**
         * @member {String} Свойство данных, в котором лежит основная выборка
         */
        _dataSetItemsProperty: '',
        /**
         * @member {String} Свойство данных, в котором лежит общее кол-во строк, выбранных запросом
         */
        _dataSetMetaProperty: '',
        _writable: entity_1.ReadWriteMixin.writable,
        constructor: function (options) {
            options = options || {};
            if (options.dataSetMetaProperty) {
                this._dataSetMetaProperty = options.dataSetMetaProperty;
            }
        },
        //region Public methods
        getAdapter: function () {
            if (typeof this._$adapter === 'string') {
                this._$adapter = di_1.create(this._$adapter);
            }
            return this._$adapter;
        },
        setAdapter: function () {
            throw new Error(this._moduleName + '::setAdapter() - method has been removed in 3.17.300 as deprecated. You should inject adapter into constructor use "adapter" option.');
        },
        getModel: function () {
            return this._$model;
        },
        setModel: function (model) {
            this._$model = model;
        },
        getListModule: function () {
            return this._$listModule;
        },
        setListModule: function (listModule) {
            this._$listModule = listModule;
        },
        getIdProperty: function () {
            return this._$idProperty;
        },
        setIdProperty: function (name) {
            this._$idProperty = name;
        },
        //endregion Public methods
        //region Protected methods
        /**
         * Определяет название свойства с первичным ключом по данным
         * @param {*} data Сырые данные
         * @return {String}
         * @protected
         */
        _getIdPropertyByData: function (data) {
            return this.getAdapter().getKeyField(data) || '';
        },
        /**
         * Создает новый экземпляр модели
         * @param {*} data Данные модели
         * @return {Types/Entity/Model}
         * @protected
         */
        _getModelInstance: function (data) {
            return di_1.create(this._$model, {
                writable: this._writable,
                rawData: data,
                adapter: this.getAdapter(),
                idProperty: this.getIdProperty()
            });
        },
        /**
         * Создает новый экземпляр DataSet
         * @param {Object} cfg Опции конструктора
         * @return {Types/Source/DataSet}
         * @protected
         */
        _getDataSetInstance: function (cfg) {
            return di_1.create(// eslint-disable-line new-cap
            this._dataSetModule, Object.assign({
                writable: this._writable,
                adapter: this.getAdapter(),
                model: this.getModel(),
                listModule: this.getListModule(),
                idProperty: this.getIdProperty() || this._getIdPropertyByData(cfg.rawData || null)
            }, cfg));
        },
        /**
         * Оборачивает данные в DataSet
         * @param {Object} data Данные
         * @return {Types/Source/DataSet}
         * @protected
         */
        _wrapToDataSet: function (data) {
            return this._getDataSetInstance({
                rawData: data,
                itemsProperty: this._dataSetItemsProperty,
                metaProperty: this._dataSetMetaProperty
            });
        },
        /**
         * Перебирает все записи выборки
         * @param {*} data Выборка
         * @param {Function} callback Ф-я обратного вызова для каждой записи
         * @param {Object} context Конекст
         * @protected
         */
        _each: function (data, callback, context) {
            var tableAdapter = this.getAdapter().forTable(data);
            for (var index = 0, count = tableAdapter.getCount(); index < count; index++) {
                callback.call(context || this, tableAdapter.at(index), index);
            }
        },
        //endregion Protected methods
        //region Statics
        /**
         * Проверяет, что это экземпляр модели
         * @param {*} instance Экземпляр модели
         * @return {Boolean}
         * @static
         */
        isModelInstance: function (instance) {
            return instance && instance['[Types/_entity/IObject]'] && instance['[Types/_entity/FormattableMixin]'];
        },
        /**
         * Проверяет, что это экземпляр списка
         * @param {*} instance Экземпляр списка
         * @return {Boolean}
         * @static
         */
        isListInstance: function (instance) {
            return instance && instance['[Types/_collection/IList]'] && instance['[Types/_entity/FormattableMixin]'];
        }    //endregion Statics
    };
    //endregion Statics
    exports.default = DataMixin;
});