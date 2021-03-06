/// <amd-module name="Types/_source/Remote" />
/**
 * Источник данных, работающий удаленно.
 * Это абстрактный класс, не предназначенный для создания самостоятельных экземпляров.
 * @class Types/_source/Remote
 * @extends Types/_source/Base
 * @implements Types/_source/ICrud
 * @implements Types/_source/ICrudPlus
 * @implements Types/_source/IProvider
 * @mixes Types/_entity/ObservableMixin
 * @mixes Types/_source/DataCrudMixin
 * @mixes Types/_source/BindingMixin
 * @mixes Types/_source/EndpointMixin
 * @ignoreOptions passing passing.create passing.read passing.update passing.destroy passing.query passing.copy
 * passing.merge passing.move
 * @public
 * @author Мальцев А.А.
 */
define('Types/_source/Remote', [
    'require',
    'exports',
    'tslib',
    'Types/_source/Base',
    'Types/_source/DataMixin',
    'Types/_source/DataCrudMixin',
    'Types/_source/BindingMixin',
    'Types/_source/EndpointMixin',
    'Types/_source/OptionsMixin',
    'Types/entity',
    'Types/di',
    'Types/util'
], function (require, exports, tslib_1, Base_1, DataMixin_1, DataCrudMixin_1, BindingMixin_1, EndpointMixin_1, OptionsMixin_1, entity_1, di_1, util_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    // tslint:disable-next-line:ban-comma-operator
    // tslint:disable-next-line:ban-comma-operator
    var global = (0, eval)('this');
    var DeferredCanceledError = global.DeferredCanceledError;    /**
     * Типы навигации для query()
     */
    /**
     * Типы навигации для query()
     */
    var NAVIGATION_TYPE = {
        PAGE: 'Page',
        OFFSET: 'Offset'
    };
    function isNull(value) {
        return value === null || value === undefined;
    }
    function isEmpty(value) {
        return value === '' || isNull(value);
    }    /**
     * Формирует данные, передваемые в провайдер при вызове create().
     * @param [meta] Дополнительные мета данные, которые могут понадобиться для создания записи
     */
    /**
     * Формирует данные, передваемые в провайдер при вызове create().
     * @param [meta] Дополнительные мета данные, которые могут понадобиться для создания записи
     */
    function passCreate(meta) {
        return [meta];
    }    /**
     * Формирует данные, передваемые в провайдер при вызове read().
     * @param key Первичный ключ записи
     * @param [meta] Дополнительные мета данные
     */
    /**
     * Формирует данные, передваемые в провайдер при вызове read().
     * @param key Первичный ключ записи
     * @param [meta] Дополнительные мета данные
     */
    function passRead(key, meta) {
        return [
            key,
            meta
        ];
    }    /**
     * Формирует данные, передваемые в провайдер при вызове update().
     * @param data Обновляемая запись или рекордсет
     * @param [meta] Дополнительные мета данные
     */
    /**
     * Формирует данные, передваемые в провайдер при вызове update().
     * @param data Обновляемая запись или рекордсет
     * @param [meta] Дополнительные мета данные
     */
    function passUpdate(data, meta) {
        if (this._$options.updateOnlyChanged) {
            var idProperty_1 = this._getValidIdProperty(data);
            if (!isEmpty(idProperty_1)) {
                if (DataMixin_1.default.isModelInstance(data) && !isNull(data.get(idProperty_1))) {
                    // Filter record fields
                    var Record_1 = require('Types/entity').Record;
                    var changed = data.getChanged();
                    changed.unshift(idProperty_1);
                    data = Record_1.filterFields(data, changed);
                } else if (DataMixin_1.default.isListInstance(data)) {
                    // Filter recordset fields
                    data = function (source) {
                        var RecordSet = require('Types/collection').RecordSet;
                        var result = new RecordSet({
                            adapter: source._$adapter,
                            idProperty: source._$idProperty
                        });
                        source.each(function (record) {
                            if (isNull(record.get(idProperty_1)) || record.isChanged()) {
                                result.add(record);
                            }
                        });
                        return result;
                    }(data);
                }
            }
        }
        return [
            data,
            meta
        ];
    }    /**
     * Формирует данные, передваемые в провайдер при вызове destroy().
     * @param keys Первичный ключ, или массив первичных ключей записи
     * @param [meta] Дополнительные мета данные
     */
    /**
     * Формирует данные, передваемые в провайдер при вызове destroy().
     * @param keys Первичный ключ, или массив первичных ключей записи
     * @param [meta] Дополнительные мета данные
     */
    function passDestroy(keys, meta) {
        return [
            keys,
            meta
        ];
    }    /**
     * Формирует данные, передваемые в провайдер при вызове query().
     * @param [query] Запрос
     */
    /**
     * Формирует данные, передваемые в провайдер при вызове query().
     * @param [query] Запрос
     */
    function passQuery(query) {
        return [query];
    }    /**
     * Формирует данные, передваемые в провайдер при вызове copy().
     * @param key Первичный ключ записи
     * @param [meta] Дополнительные мета данные
     */
    /**
     * Формирует данные, передваемые в провайдер при вызове copy().
     * @param key Первичный ключ записи
     * @param [meta] Дополнительные мета данные
     */
    function passCopy(key, meta) {
        return [
            key,
            meta
        ];
    }    /**
     * Формирует данные, передваемые в провайдер при вызове merge().
     * @param from Первичный ключ записи-источника (при успешном объедининии запись будет удалена)
     * @param to Первичный ключ записи-приёмника
     */
    /**
     * Формирует данные, передваемые в провайдер при вызове merge().
     * @param from Первичный ключ записи-источника (при успешном объедининии запись будет удалена)
     * @param to Первичный ключ записи-приёмника
     */
    function passMerge(from, to) {
        return [
            from,
            to
        ];
    }    /**
     * Формирует данные, передваемые в провайдер при вызове move().
     * @param items Перемещаемая запись.
     * @param target Идентификатор целевой записи, относительно которой позиционируются перемещаемые.
     * @param [meta] Дополнительные мета данные.
     */
    /**
     * Формирует данные, передваемые в провайдер при вызове move().
     * @param items Перемещаемая запись.
     * @param target Идентификатор целевой записи, относительно которой позиционируются перемещаемые.
     * @param [meta] Дополнительные мета данные.
     */
    function passMove(from, to, meta) {
        return [
            from,
            to,
            meta
        ];
    }
    var Remote = /** @class */
    function (_super) {
        tslib_1.__extends(Remote, _super);    // @ts-ignore
        // @ts-ignore
        function Remote(options) {
            var _this = this;    // region ICrud
            // region ICrud
            _this['[Types/_source/ICrud]'] = true;    // endregion
                                                      // region ICrudPlus
            // endregion
            // region ICrudPlus
            _this['[Types/_source/ICrudPlus]'] = true;    // endregion
                                                          // region IProvider
            // endregion
            // region IProvider
            _this['[Types/_source/IProvider]'] = true;    // @ts-ignore
            // @ts-ignore
            BindingMixin_1.default.constructor.call(_this, options);    // @ts-ignore
            // @ts-ignore
            EndpointMixin_1.default.constructor.call(_this, options);
            _this = _super.call(this, options) || this;
            entity_1.ObservableMixin.call(_this, options);
            _this._publish('onBeforeProviderCall');
            return _this;
        }
        Remote.prototype.create = function (meta) {
            var _this = this;
            return this._callProvider(this._$binding.create, this._$passing.create.call(this, meta)).addCallback(function (data) {
                return _this._loadAdditionalDependencies().addCallback(function () {
                    return _this._prepareCreateResult(data);
                });
            });
        };
        Remote.prototype.read = function (key, meta) {
            var _this = this;
            return this._callProvider(this._$binding.read, this._$passing.read.call(this, key, meta)).addCallback(function (data) {
                return _this._loadAdditionalDependencies().addCallback(function () {
                    return _this._prepareReadResult(data);
                });
            });
        };
        Remote.prototype.update = function (data, meta) {
            var _this = this;
            return this._callProvider(this._$binding.update, this._$passing.update.call(this, data, meta)).addCallback(function (key) {
                return _this._prepareUpdateResult(data, key);
            });
        };
        Remote.prototype.destroy = function (keys, meta) {
            return this._callProvider(this._$binding.destroy, this._$passing.destroy.call(this, keys, meta));
        };
        Remote.prototype.query = function (query) {
            var _this = this;
            return this._callProvider(this._$binding.query, this._$passing.query.call(this, query)).addCallback(function (data) {
                return _this._loadAdditionalDependencies().addCallback(function () {
                    return _this._prepareQueryResult(data);
                });
            });
        };
        Remote.prototype.merge = function (from, to) {
            return this._callProvider(this._$binding.merge, this._$passing.merge.call(this, from, to));
        };
        Remote.prototype.copy = function (key, meta) {
            var _this = this;
            return this._callProvider(this._$binding.copy, this._$passing.copy.call(this, key, meta)).addCallback(function (data) {
                return _this._prepareReadResult(data);
            });
        };
        Remote.prototype.move = function (items, target, meta) {
            return this._callProvider(this._$binding.move, this._$passing.move.call(this, items, target, meta));
        };
        Remote.prototype.getEndpoint = function () {
            return EndpointMixin_1.default.getEndpoint.call(this);
        };
        Remote.prototype.getProvider = function () {
            if (!this._provider) {
                this._provider = this._createProvider(this._$provider, {
                    endpoint: this._$endpoint,
                    options: this._$options
                });
            }
            return this._provider;
        };    // endregion
              // region Protected methods
              /**
         * Инстанциирует провайдер удаленного доступа
         * @param {String|Types/_source/Provider/IAbstract} provider Алиас или инстанс
         * @param {Object} options Аргументы конструктора
         * @return {Types/_source/Provider}
         * @protected
         */
        // endregion
        // region Protected methods
        /**
         * Инстанциирует провайдер удаленного доступа
         * @param {String|Types/_source/Provider/IAbstract} provider Алиас или инстанс
         * @param {Object} options Аргументы конструктора
         * @return {Types/_source/Provider}
         * @protected
         */
        Remote.prototype._createProvider = function (provider, options) {
            if (!provider) {
                throw new Error('Remote access provider is not defined');
            }
            if (typeof provider === 'string') {
                provider = di_1.create(provider, options);
            }
            return provider;
        };    /**
         * Вызывает удаленный сервис через провайдер
         * @param {String} name Имя сервиса
         * @param {Object|Array} [args] Аргументы вызова
         * @return {Core/Deferred} Асинхронный результат операции
         * @protected
         */
        /**
         * Вызывает удаленный сервис через провайдер
         * @param {String} name Имя сервиса
         * @param {Object|Array} [args] Аргументы вызова
         * @return {Core/Deferred} Асинхронный результат операции
         * @protected
         */
        Remote.prototype._callProvider = function (name, args) {
            var _this = this;
            var provider = this.getProvider();
            var eventResult = this._notify('onBeforeProviderCall', name, args);
            if (eventResult !== undefined) {
                args = eventResult;
            }
            var result = provider.call(name, this._prepareProviderArguments(args));
            if (this._$options.debug) {
                result.addErrback(function (error) {
                    if (error instanceof DeferredCanceledError) {
                        util_1.logger.info(_this._moduleName, 'calling of remote service "' + name + '" has been cancelled.');
                    } else {
                        util_1.logger.error(_this._moduleName, 'remote service "' + name + '" throws an error "' + error.message + '".');
                    }
                    return error;
                });
            }
            return result;
        };    /**
         * Подготавливает аргументы к передаче в удаленный сервис
         * @param {Object} [args] Аргументы вызова
         * @return {Object|undefined}
         * @protected
         */
        /**
         * Подготавливает аргументы к передаче в удаленный сервис
         * @param {Object} [args] Аргументы вызова
         * @return {Object|undefined}
         * @protected
         */
        Remote.prototype._prepareProviderArguments = function (args) {
            return this.getAdapter().serialize(args);
        };
        Remote.prototype._getValidIdProperty = function (data) {
            var idProperty = this.getIdProperty();
            if (!isEmpty(idProperty)) {
                return idProperty;
            }
            if (typeof data.getIdProperty === 'function') {
                return data.getIdProperty();
            }    // FIXME: тут стоит выбросить исключение, поскольку в итоге возвращаем пустой idProperty
            // FIXME: тут стоит выбросить исключение, поскольку в итоге возвращаем пустой idProperty
            return idProperty;
        };
        Object.defineProperty(Remote, 'NAVIGATION_TYPE', {
            // endregion
            // region Statics
            get: function () {
                return NAVIGATION_TYPE;
            },
            enumerable: true,
            configurable: true
        });
        return Remote;
    }(util_1.mixin(Base_1.default, entity_1.ObservableMixin, DataCrudMixin_1.default, BindingMixin_1.default, EndpointMixin_1.default));
    exports.default = Remote;
    Object.assign(Remote.prototype, /** @lends Types/_source/Remote.prototype */
    {
        '[Types/_source/Remote]': true,
        _moduleName: 'Types/source:Remote',
        _provider: null,
        _$provider: null,
        _$passing: {
            /**
             * @cfg {Function} Метод подготовки аргументов при вызове {@link create}.
             * @name Types/_source/Remote#passing.create
             */
            create: passCreate,
            /**
             * @cfg {Function} Метод подготовки аргументов при вызове {@link read}.
             * @name Types/_source/Remote#passing.read
             */
            read: passRead,
            /**
             * @cfg {Function} Метод подготовки аргументов при вызове {@link update}.
             * @name Types/_source/Remote#passing.update
             */
            update: passUpdate,
            /**
             * @cfg {Function} Метод подготовки аргументов при вызове {@link destroy}.
             * @name Types/_source/Remote#passing.destroy
             */
            destroy: passDestroy,
            /**
             * @cfg {Function} Метод подготовки аргументов при вызове {@link query}.
             * @name Types/_source/Remote#passing.query
             */
            query: passQuery,
            /**
             * @cfg {Function} Метод подготовки аргументов при вызове {@link copy}.
             * @name Types/_source/Remote#passing.copy
             */
            copy: passCopy,
            /**
             * @cfg {Function} Метод подготовки аргументов при вызове {@link merge}.
             * @name Types/_source/Remote#passing.merge
             */
            merge: passMerge,
            /**
             * @cfg {Function} Метод подготовки аргументов при вызове {@link move}.
             * @name Types/_source/Remote#passing.move
             */
            move: passMove
        },
        _$options: OptionsMixin_1.default.addOptions(Base_1.default, {
            /**
             * @cfg {Boolean} При сохранении отправлять только измененные записи (если обновляется набор записей) или только
             * измененые поля записи (если обновляется одна запись).
             * @name Types/_source/Remote#options.updateOnlyChanged
             * @remark
             * Задавать опцию имеет смысл только если указано значение опции {@link idProperty}, позволяющая отличить новые
             * записи от уже существующих.
             */
            updateOnlyChanged: false,
            /**
             * @cfg {NavigationType} Тип навигации, используемой в методе {@link query}.
             * @name Types/_source/Remote#options.navigationType
             * @example
             * Получим заказы магазина за сегодня с двадцать первого по тридцатый c использованием навигации через смещение:
             * <pre>
             *    var dataSource = new RemoteSource({
             *          endpoint: 'Orders'
             *          options: {
             *             navigationType: RemoteSource.prototype.NAVIGATION_TYPE.OFFSET
             *          }
             *       }),
             *       query = new Query();
             *
             *    query.select([
             *          'id',
             *          'date',
             *          'amount'
             *       ])
             *       .where({
             *          'date': new Date()
             *       })
             *       .orderBy('id')
             *       .offset(20)
             *       .limit(10);
             *
             *    dataSource.query(query).addCallbacks(function(dataSet) {
             *       var orders = dataSet.getAll();
             *    }, function(error) {
             *       console.error(error);
             *    });
             * </pre>
             */
            navigationType: NAVIGATION_TYPE.PAGE
        })
    });    // FIXME: backward compatibility for SbisFile/Source/BL
           // @ts-ignore
    // FIXME: backward compatibility for SbisFile/Source/BL
    // @ts-ignore
    Remote.prototype._prepareArgumentsForCall = Remote.prototype._prepareProviderArguments;
});