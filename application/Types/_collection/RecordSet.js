/// <amd-module name="Types/_collection/RecordSet" />
/**
 * Рекордсет - список записей, имеющих общий формат полей.
 *
 * Основные аспекты рекордсета (дополнительно к аспектам {@link Types/_collection/ObservableList}):
 * <ul>
 *    <li>манипуляции с форматом полей. За реализацию аспекта отвечает примесь {@link Types/_entity/FormattableMixin};</li>
 *    <li>манипуляции с сырыми данными посредством адаптера. За реализацию аспекта отвечает примесь {@link Types/_entity/FormattableMixin}.</li>
 * </ul>
 * Элементами рекордсета могут быть только {@link Types/_entity/Record записи}, причем формат полей всех записей должен совпадать.
 *
 * Создадим рекордсет, в котором в качестве сырых данных используется JSON (адаптер для данных в таком формате используется по умолчанию):
 * <pre>
 *    require(['Types/collection'], function (collection) {
 *       var characters = new collection.RecordSet({
 *          rawData: [{
 *             id: 1,
 *             firstName: 'Tom',
 *             lastName: 'Sawyer'
 *          }, {
 *             id: 2,
 *             firstName: 'Huckleberry',
 *             lastName: 'Finn'
 *          }]
 *       });
 *       characters.at(0).get('firstName');//'Tom'
 *       characters.at(1).get('firstName');//'Huckleberry'
 *    });
 * </pre>
 * Создадим рекордсет, в котором в качестве сырых данных используется ответ БЛ СБИС (адаптер для данных в таком формате укажем явно):
 * <pre>
 *    require([
 *       'Types/collection',
 *       'Types/source'
 *    ], function (collection, source) {
 *       var ds = new source.SbisService({endpoint: 'Employee'});
 *       ds.call('list', {department: 'designers'}).addCallback(function(response) {
 *          var designers = new collection.RecordSet({
 *             rawData: response.getRawData(),
 *             adapter: response.getAdapter()
 *          });
 *          console.log(designers.getCount());
 *       });
 *    });
 * </pre>
 * @class Types/_collection/RecordSet
 * @extends Types/_collection/ObservableList
 * @implements Types/_entity/IObjectNotify
 * @implements Types/_entity/IInstantiable
 * @implements Types/_entity/IProducible
 * @mixes Types/_entity/FormattableMixin
 * @mixes Types/_entity/InstantiableMixin
 * @ignoreOptions items
 * @author Мальцев А.А.
 * @public
 */
define('Types/_collection/RecordSet', [
    'require',
    'exports',
    'tslib',
    'Types/_collection/IObservable',
    'Types/_collection/ObservableList',
    'Types/_collection/enumerator/Arraywise',
    'Types/_collection/Indexer',
    'Types/entity',
    'Types/di',
    'Types/util',
    'Types/object'
], function (require, exports, tslib_1, IObservable_1, ObservableList_1, Arraywise_1, Indexer_1, entity_1, di_1, util_1, object_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var DEFAULT_MODEL = 'Types/entity:Model';
    var RECORD_STATE = entity_1.Record.RecordState;
    var developerMode = false;    /**
     *
     * @param value
     * @param idProperty
     */
    /**
     *
     * @param value
     * @param idProperty
     */
    function checkNullId(value, idProperty) {
        if (developerMode && idProperty) {
            if (value && value['[Types/_entity/Record]'] && value.get(idProperty) === null) {
                util_1.logger.info('Types/_collection/RecordSet: Id propery must not be null');
            } else if (value instanceof RecordSet) {
                value.each(function (item) {
                    checkNullId(item, idProperty);
                });
            }
        }
    }
    var RecordSet = /** @class */
    function (_super) {
        tslib_1.__extends(RecordSet, _super);
        function RecordSet(options) {
            var _this = this;
            if (options) {
                if ('items' in options) {
                    util_1.logger.stack('Types/_collection/RecordSet: option "items" give no effect, use "rawData" instead', 1);
                }
            }
            _this = _super.call(this, options) || this;
            if (options) {
                if ('meta' in options) {
                    _this._$metaData = options.meta;
                }
            }    // Model can have it's own format. Inherit that format if RecordSet's format is not defined.
                 // FIXME: It only works with model's constructor injection not string alias
            // Model can have it's own format. Inherit that format if RecordSet's format is not defined.
            // FIXME: It only works with model's constructor injection not string alias
            if (!_this._$format && _this._$model && typeof _this._$model === 'function' && _this._$model.prototype._$format) {
                _this._$format = _this._$model.prototype._$format;
            }
            entity_1.FormattableMixin.constructor.call(_this, options);
            if (!_this._$idProperty) {
                _this._$idProperty = _this._getAdapter().getKeyField(_this._getRawData());
            }
            if (_this._$rawData) {
                _this._assignRawData(_this._getRawData(true), true);
                _this._initByRawData();
            }
            _this._publish('onPropertyChange');
            return _this;
        }
        RecordSet.produceInstance = function (data, options) {
            var instanceOptions = { rawData: data };
            if (options) {
                if (options.adapter) {
                    instanceOptions.adapter = options.adapter;
                }
                if (options.model) {
                    instanceOptions.model = options.model;
                }
            }
            return new this(instanceOptions);
        };    // endregion Protected methods
              // region Statics
              /**
         * Создает из рекордсета патч - запись с измененными, добавленными записями и ключами удаленных записей.
         * @param {Types/_collection/RecordSet} items Исходный рекордсет
         * @param {Array.<String>} [names] Имена полей результирующей записи, по умолчанию ['changed', 'added', 'removed']
         * @return {Types/_entity/Record} Патч
         */
        // endregion Protected methods
        // region Statics
        /**
         * Создает из рекордсета патч - запись с измененными, добавленными записями и ключами удаленных записей.
         * @param {Types/_collection/RecordSet} items Исходный рекордсет
         * @param {Array.<String>} [names] Имена полей результирующей записи, по умолчанию ['changed', 'added', 'removed']
         * @return {Types/_entity/Record} Патч
         */
        RecordSet.patch = function (items, names) {
            names = names || [
                'changed',
                'added',
                'removed'
            ];
            var filter = function (state) {
                var result = new RecordSet({
                    adapter: items.getAdapter(),
                    idProperty: items.getIdProperty()
                });
                items.each(function (item) {
                    result.add(item);
                }, state);
                return result;
            };
            var getIds = function (items) {
                var result = [];
                var idProperty = items.getIdProperty();
                items.each(function (item) {
                    result.push(item.get(idProperty));
                });
                return result;
            };
            var result = new entity_1.Record({
                format: [
                    {
                        name: names[0],
                        type: 'recordset'
                    },
                    {
                        name: names[1],
                        type: 'recordset'
                    },
                    {
                        name: names[2],
                        type: 'array',
                        kind: 'string'
                    }
                ],
                adapter: items.getAdapter()
            });
            result.set(names[0], filter(RECORD_STATE.CHANGED));
            result.set(names[1], filter(RECORD_STATE.ADDED));
            result.set(names[2], getIds(filter(RECORD_STATE.DELETED)));
            result.acceptChanges();
            return result;
        };
        RecordSet.prototype.destroy = function () {
            this._$model = '';
            this._$metaData = null;
            this._metaData = null;
            _super.prototype.destroy.call(this);
        };    // region IReceiver
        // region IReceiver
        RecordSet.prototype.relationChanged = function (which, route) {
            var index = this.getIndex(which.target);
            if (index > -1) {
                // Apply record's raw data to the self raw data if necessary
                var adapter = this._getRawDataAdapter();
                var selfData = adapter.at(index);
                var recordData = which.target.getRawData(true);
                if (selfData !== recordData) {
                    this._getRawDataAdapter().replace(recordData, index);
                }
            }
            return _super.prototype.relationChanged.call(this, which, route);
        };    // endregion IObservableObject
              // region ICloneable
        // endregion IObservableObject
        // region ICloneable
        RecordSet.prototype.clone = function (shallow) {
            var clone = _super.prototype.clone.call(this, shallow);
            if (shallow) {
                clone._$items = this._$items.slice();
            }
            return clone;
        };    // endregion IProducible
              // region IEquatable
        // endregion IProducible
        // region IEquatable
        RecordSet.prototype.isEqual = function (to) {
            if (to === this) {
                return true;
            }
            if (!to) {
                return false;
            }
            if (!(to instanceof RecordSet)) {
                return false;
            }    // TODO: compare using formats
            // TODO: compare using formats
            return object_1.isEqual(this._getRawData(), to.getRawData(true));
        };    // endregion IEquatable
              // region IEnumerable
              /**
         * Возвращает энумератор для перебора записей рекордсета.
         * Пример использования можно посмотреть в модуле {@link Types/_collection/IEnumerable}.
         * @param {Types/_entity/Record/RecordState.typedef} [state] Состояние записей, которые требуется перебрать (по умолчанию перебираются все записи)
         * @return {Types/_collection/ArrayEnumerator.<Types/_entity/Record>}
         * @example
         * Получим сначала все, а затем - измененные записи:
         * <pre>
         *    require(['Types/_entity/Record'], function(Record) {
         *       var fruits = new RecordSet({
         *             rawData: [
         *                {name: 'Apple'},
         *                {name: 'Banana'},
         *                {name: 'Orange'},
         *                {name: 'Strawberry'}
         *             ]
         *          }),
         *          fruit,
         *          enumerator;
         *
         *       fruits.at(0).set('name', 'Pineapple');
         *       fruits.at(2).set('name', 'Grapefruit');
         *
         *       enumerator = fruits.getEnumerator();
         *       while(enumerator.moveNext()) {
         *          fruit = enumerator.getCurrent();
         *          console.log(fruit.get('name'));
         *       }
         *       //output: 'Pineapple', 'Banana', 'Grapefruit', 'Strawberry'
         *
         *       enumerator = fruits.getEnumerator(Record.RecordState.CHANGED);
         *       while(enumerator.moveNext()) {
         *          fruit = enumerator.getCurrent();
         *          console.log(fruit.get('name'));
         *       }
         *       //output: 'Pineapple', 'Grapefruit'
         *    });
         * </pre>
         */
        // endregion IEquatable
        // region IEnumerable
        /**
         * Возвращает энумератор для перебора записей рекордсета.
         * Пример использования можно посмотреть в модуле {@link Types/_collection/IEnumerable}.
         * @param {Types/_entity/Record/RecordState.typedef} [state] Состояние записей, которые требуется перебрать (по умолчанию перебираются все записи)
         * @return {Types/_collection/ArrayEnumerator.<Types/_entity/Record>}
         * @example
         * Получим сначала все, а затем - измененные записи:
         * <pre>
         *    require(['Types/_entity/Record'], function(Record) {
         *       var fruits = new RecordSet({
         *             rawData: [
         *                {name: 'Apple'},
         *                {name: 'Banana'},
         *                {name: 'Orange'},
         *                {name: 'Strawberry'}
         *             ]
         *          }),
         *          fruit,
         *          enumerator;
         *
         *       fruits.at(0).set('name', 'Pineapple');
         *       fruits.at(2).set('name', 'Grapefruit');
         *
         *       enumerator = fruits.getEnumerator();
         *       while(enumerator.moveNext()) {
         *          fruit = enumerator.getCurrent();
         *          console.log(fruit.get('name'));
         *       }
         *       //output: 'Pineapple', 'Banana', 'Grapefruit', 'Strawberry'
         *
         *       enumerator = fruits.getEnumerator(Record.RecordState.CHANGED);
         *       while(enumerator.moveNext()) {
         *          fruit = enumerator.getCurrent();
         *          console.log(fruit.get('name'));
         *       }
         *       //output: 'Pineapple', 'Grapefruit'
         *    });
         * </pre>
         */
        RecordSet.prototype.getEnumerator = function (state) {
            var _this = this;
            var enumerator = new Arraywise_1.default(this._$items);
            enumerator.setResolver(function (index) {
                return _this.at(index);
            });
            if (state) {
                enumerator.setFilter(function (record) {
                    return record.getState() === state;
                });
            }
            return enumerator;
        };    /**
         * Перебирает записи рекордсета.
         * @param {Function(Types/_entity/Record, Number)} callback Функция обратного вызова, аргументами будут переданы запись и ее позиция.
         * @param {Types/_entity/Record/RecordState.typedef} [state] Состояние записей, которые требуется перебрать (по умолчанию перебираются все записи)
         * @param {Object} [context] Контекст вызова callback
         * @example
         * Получим сначала все, а затем - измененные записи:
         * <pre>
         *    require([
         *       'Types/collection',
         *       'Types/entity'
         *    ], function(collection, entity) {
         *       var fruits = new collection.RecordSet({
         *          rawData: [
         *             {name: 'Apple'},
         *             {name: 'Banana'},
         *             {name: 'Orange'},
         *             {name: 'Strawberry'}
         *          ]
         *       });
         *
         *       fruits.at(0).set('name', 'Pineapple');
         *       fruits.at(2).set('name', 'Grapefruit');
         *
         *       fruits.each(function(fruit) {
         *          console.log(fruit.get('name'));
         *       });
         *       //output: 'Pineapple', 'Banana', 'Grapefruit', 'Strawberry'
         *
         *       fruits.each(function(fruit) {
         *          console.log(fruit.get('name'));
         *       }, entity.Record.RecordState.CHANGED);
         *       //output: 'Pineapple', 'Grapefruit'
         *    });
         * </pre>
         */
        /**
         * Перебирает записи рекордсета.
         * @param {Function(Types/_entity/Record, Number)} callback Функция обратного вызова, аргументами будут переданы запись и ее позиция.
         * @param {Types/_entity/Record/RecordState.typedef} [state] Состояние записей, которые требуется перебрать (по умолчанию перебираются все записи)
         * @param {Object} [context] Контекст вызова callback
         * @example
         * Получим сначала все, а затем - измененные записи:
         * <pre>
         *    require([
         *       'Types/collection',
         *       'Types/entity'
         *    ], function(collection, entity) {
         *       var fruits = new collection.RecordSet({
         *          rawData: [
         *             {name: 'Apple'},
         *             {name: 'Banana'},
         *             {name: 'Orange'},
         *             {name: 'Strawberry'}
         *          ]
         *       });
         *
         *       fruits.at(0).set('name', 'Pineapple');
         *       fruits.at(2).set('name', 'Grapefruit');
         *
         *       fruits.each(function(fruit) {
         *          console.log(fruit.get('name'));
         *       });
         *       //output: 'Pineapple', 'Banana', 'Grapefruit', 'Strawberry'
         *
         *       fruits.each(function(fruit) {
         *          console.log(fruit.get('name'));
         *       }, entity.Record.RecordState.CHANGED);
         *       //output: 'Pineapple', 'Grapefruit'
         *    });
         * </pre>
         */
        RecordSet.prototype.each = function (callback, state, context) {
            if (state instanceof Object) {
                context = state;
                state = undefined;
            }
            context = context || this;
            var length = this.getCount();
            var index = 0;
            var isMatching;
            var record;
            for (var i = 0; i < length; i++) {
                record = this.at(i);
                if (state) {
                    isMatching = record.getState() === state;
                } else {
                    isMatching = true;
                }
                if (isMatching) {
                    callback.call(context, record, index++, this);
                }
            }
        };    // endregion IEnumerable
              // region List
        // endregion IEnumerable
        // region List
        RecordSet.prototype.clear = function () {
            var item;
            for (var i = 0, count = this._$items.length; i < count; i++) {
                item = this._$items[i];
                if (item) {
                    item.detach();
                }
            }
            this._getRawDataAdapter().clear();
            _super.prototype.clear.call(this);
        };    /**
         * Добавляет запись в рекордсет путем создания новой записи, в качестве сырых данных для которой будут взяты сырые данные аргумента item.
         * Если формат созданной записи не совпадает с форматом рекордсета, то он будет приведен к нему принудительно: лишние поля будут отброшены, недостающие - проинициализированы значениями по умолчанию.
         * При недопустимом at генерируется исключение.
         * @param {Types/_entity/Record} item Запись, из которой будут извлечены сырые данные.
         * @param {Number} [at] Позиция, в которую добавляется запись (по умолчанию - в конец)
         * @return {Types/_entity/Record} Добавленная запись.
         * @see Types/_collection/ObservableList#add
         * @example
         * Добавим запись в рекордсет:
         * <pre>
         *    require(['Types/collection', 'Types/entity'], function(collection, entity) {
         *       var rs = new collection.RecordSet();
         *       var source = new entity.Record({
         *          rawData: {foo: 'bar'}
         *       });
         *       var result = rs.add(source);
         *
         *       console.log(result === source);//false
         *       console.log(result.get('foo') === source.get('foo'));//true
         *
         *       console.log(source.getOwner() === rs);//false
         *       console.log(result.getOwner() === rs);//true
         *    });
         * </pre>
         */
        /**
         * Добавляет запись в рекордсет путем создания новой записи, в качестве сырых данных для которой будут взяты сырые данные аргумента item.
         * Если формат созданной записи не совпадает с форматом рекордсета, то он будет приведен к нему принудительно: лишние поля будут отброшены, недостающие - проинициализированы значениями по умолчанию.
         * При недопустимом at генерируется исключение.
         * @param {Types/_entity/Record} item Запись, из которой будут извлечены сырые данные.
         * @param {Number} [at] Позиция, в которую добавляется запись (по умолчанию - в конец)
         * @return {Types/_entity/Record} Добавленная запись.
         * @see Types/_collection/ObservableList#add
         * @example
         * Добавим запись в рекордсет:
         * <pre>
         *    require(['Types/collection', 'Types/entity'], function(collection, entity) {
         *       var rs = new collection.RecordSet();
         *       var source = new entity.Record({
         *          rawData: {foo: 'bar'}
         *       });
         *       var result = rs.add(source);
         *
         *       console.log(result === source);//false
         *       console.log(result.get('foo') === source.get('foo'));//true
         *
         *       console.log(source.getOwner() === rs);//false
         *       console.log(result.getOwner() === rs);//true
         *    });
         * </pre>
         */
        RecordSet.prototype.add = function (item, at) {
            item = this._normalizeItems([item], RECORD_STATE.ADDED)[0];
            this._getRawDataAdapter().add(item.getRawData(true), at);
            _super.prototype.add.call(this, item, at);
            return item;
        };
        RecordSet.prototype.at = function (index) {
            return this._getRecord(index);
        };
        RecordSet.prototype.remove = function (item) {
            this._checkItem(item);
            return _super.prototype.remove.call(this, item);
        };
        RecordSet.prototype.removeAt = function (index) {
            this._getRawDataAdapter().remove(index);
            var item = this._$items[index];
            var result = _super.prototype.removeAt.call(this, index);
            if (item) {
                item.detach();
            }
            return result;
        };    /**
         * Заменяет запись в указанной позиции через создание новой записи, в качестве сырых данных для которой будут взяты сырые данные аргумента item.
         * Если формат созданной записи не совпадает с форматом рекордсета, то он будет приведен к нему принудительно: лишние поля будут отброшены, недостающие - проинициализированы значениями по умолчанию.
         * При недопустимом at генерируется исключение.
         * @param {Types/_entity/Record} item Заменяющая запись, из которой будут извлечены сырые данные.
         * @param {Number} at Позиция, в которой будет произведена замена
         * @return {Array.<Types/_entity/Record>} Добавленная запись
         * @see Types/_collection/ObservableList#replace
         * @example
         * Заменим вторую запись:
         * <pre>
         *    require(['Types/collection', 'Types/entity'], function(collection, entity) {
         *       var rs = new collection.RecordSet({
         *          rawData: [{
         *             id: 1,
         *             title: 'Water'
         *          }, {
         *             id: 2,
         *             title: 'Ice'
         *          }]
         *       });
         *       var source = new entity.Record({
         *          rawData: {
         *             id: 3,
         *             title: 'Snow'
         *          }
         *       });
         *
         *       rs.replace(source, 1);
         *       var result = rs.at(1);
         *
         *       console.log(result === source);//false
         *       console.log(result.get('title') === source.get('title'));//true
         *
         *       console.log(source.getOwner() === rs);//false
         *       console.log(result.getOwner() === rs);//true
         *    });
         * </pre>
         */
        /**
         * Заменяет запись в указанной позиции через создание новой записи, в качестве сырых данных для которой будут взяты сырые данные аргумента item.
         * Если формат созданной записи не совпадает с форматом рекордсета, то он будет приведен к нему принудительно: лишние поля будут отброшены, недостающие - проинициализированы значениями по умолчанию.
         * При недопустимом at генерируется исключение.
         * @param {Types/_entity/Record} item Заменяющая запись, из которой будут извлечены сырые данные.
         * @param {Number} at Позиция, в которой будет произведена замена
         * @return {Array.<Types/_entity/Record>} Добавленная запись
         * @see Types/_collection/ObservableList#replace
         * @example
         * Заменим вторую запись:
         * <pre>
         *    require(['Types/collection', 'Types/entity'], function(collection, entity) {
         *       var rs = new collection.RecordSet({
         *          rawData: [{
         *             id: 1,
         *             title: 'Water'
         *          }, {
         *             id: 2,
         *             title: 'Ice'
         *          }]
         *       });
         *       var source = new entity.Record({
         *          rawData: {
         *             id: 3,
         *             title: 'Snow'
         *          }
         *       });
         *
         *       rs.replace(source, 1);
         *       var result = rs.at(1);
         *
         *       console.log(result === source);//false
         *       console.log(result.get('title') === source.get('title'));//true
         *
         *       console.log(source.getOwner() === rs);//false
         *       console.log(result.getOwner() === rs);//true
         *    });
         * </pre>
         */
        RecordSet.prototype.replace = function (item, at) {
            item = this._normalizeItems([item], RECORD_STATE.CHANGED)[0];
            this._getRawDataAdapter().replace(item.getRawData(true), at);
            var oldItem = this._$items[at];
            _super.prototype.replace.call(this, item, at);
            if (oldItem) {
                oldItem.detach();
            }
            return item;
        };
        RecordSet.prototype.move = function (from, to) {
            this._getRecord(from);    // force create record instance
            // force create record instance
            this._getRawDataAdapter().move(from, to);
            _super.prototype.move.call(this, from, to);
        };    /**
         * Заменяет записи рекордсета копиями записей другой коллекции.
         * Если формат созданных копий не совпадает с форматом рекордсета, то он будет приведен к нему принудительно: лишние поля будут отброшены, недостающие - проинициализированы значениями по умолчанию.
         * @param {Types/_collection/IEnumerable.<Types/_entity/Record>|Array.<Types/_entity/Record>} [items] Коллекция с записями для замены
         * @return {Array.<Types/_entity/Record>} Добавленные записи
         * @see Types/_collection/ObservableList#assign
         */
        /**
         * Заменяет записи рекордсета копиями записей другой коллекции.
         * Если формат созданных копий не совпадает с форматом рекордсета, то он будет приведен к нему принудительно: лишние поля будут отброшены, недостающие - проинициализированы значениями по умолчанию.
         * @param {Types/_collection/IEnumerable.<Types/_entity/Record>|Array.<Types/_entity/Record>} [items] Коллекция с записями для замены
         * @return {Array.<Types/_entity/Record>} Добавленные записи
         * @see Types/_collection/ObservableList#assign
         */
        RecordSet.prototype.assign = function (items) {
            if (items === this) {
                return [];
            }
            var oldItems = this._$items.slice();
            var result;
            if (items instanceof RecordSet) {
                this._$adapter = items.getAdapter();
                this._assignRawData(items.getRawData(), this._hasFormat());
                result = new Array(items.getCount());
                _super.prototype.assign.call(this, result);
            } else {
                items = this._itemsToArray(items);
                if (items.length && items[0] && items[0]['[Types/_entity/Record]']) {
                    this._$adapter = items[0].getAdapter();
                }
                items = this._normalizeItems(items, RECORD_STATE.ADDED);
                this._assignRawData(null, this._hasFormat());
                items = this._addItemsToRawData(items);
                _super.prototype.assign.call(this, items);
                result = items;
            }
            var item;
            for (var i = 0, count = oldItems.length; i < count; i++) {
                item = oldItems[i];
                if (item) {
                    item.detach();
                }
            }
            return result;
        };    /**
         * Добавляет копии записей другой коллекции в конец рекордсета.
         * Если формат созданных копий не совпадает с форматом рекордсета, то он будет приведен к нему принудительно: лишние поля будут отброшены, недостающие - проинициализированы значениями по умолчанию.
         * @param {Types/_collection/IEnumerable.<Types/_entity/Record>|Array.<Types/_entity/Record>} [items] Коллекция с записями для добавления
         * @return {Array.<Types/_entity/Record>} Добавленные записи
         * @see Types/_collection/ObservableList#append
         */
        /**
         * Добавляет копии записей другой коллекции в конец рекордсета.
         * Если формат созданных копий не совпадает с форматом рекордсета, то он будет приведен к нему принудительно: лишние поля будут отброшены, недостающие - проинициализированы значениями по умолчанию.
         * @param {Types/_collection/IEnumerable.<Types/_entity/Record>|Array.<Types/_entity/Record>} [items] Коллекция с записями для добавления
         * @return {Array.<Types/_entity/Record>} Добавленные записи
         * @see Types/_collection/ObservableList#append
         */
        RecordSet.prototype.append = function (items) {
            items = this._itemsToArray(items);
            items = this._normalizeItems(items, RECORD_STATE.ADDED);
            items = this._addItemsToRawData(items);
            _super.prototype.append.call(this, items);
            return items;
        };    /**
         * Добавляет копии записей другой коллекции в начало рекордсета.
         * Если формат созданных копий не совпадает с форматом рекордсета, то он будет приведен к нему принудительно: лишние поля будут отброшены, недостающие - проинициализированы значениями по умолчанию.
         * @param {Types/_collection/IEnumerable.<Types/_entity/Record>|Array.<Types/_entity/Record>} [items] Коллекция с записями для добавления
         * @return {Array.<Types/_entity/Record>} Добавленные записи
         * @see Types/_collection/ObservableList#prepend
         */
        /**
         * Добавляет копии записей другой коллекции в начало рекордсета.
         * Если формат созданных копий не совпадает с форматом рекордсета, то он будет приведен к нему принудительно: лишние поля будут отброшены, недостающие - проинициализированы значениями по умолчанию.
         * @param {Types/_collection/IEnumerable.<Types/_entity/Record>|Array.<Types/_entity/Record>} [items] Коллекция с записями для добавления
         * @return {Array.<Types/_entity/Record>} Добавленные записи
         * @see Types/_collection/ObservableList#prepend
         */
        RecordSet.prototype.prepend = function (items) {
            items = this._itemsToArray(items);
            items = this._normalizeItems(items, RECORD_STATE.ADDED);
            items = this._addItemsToRawData(items, 0);
            _super.prototype.prepend.call(this, items);
            return items;
        };    /**
         * Возвращает индексатор коллекции
         * @return {Types/_collection/Indexer}
         * @protected
         */
        /**
         * Возвращает индексатор коллекции
         * @return {Types/_collection/Indexer}
         * @protected
         */
        RecordSet.prototype._getIndexer = function () {
            var _this = this;
            if (this._indexer) {
                return this._indexer;
            }
            var indexer;    // Custom model possible has different properties collection, this cause switch to the slow not lazy mode
            // Custom model possible has different properties collection, this cause switch to the slow not lazy mode
            if (this._$model === this._defaultModel) {
                // Fast mode: indexing without record instances
                var adapter_1 = this._getAdapter();
                var tableAdapter_1 = this._getRawDataAdapter();
                indexer = new Indexer_1.default(this._getRawData(), function () {
                    return tableAdapter_1.getCount();
                }, function (items, at) {
                    return tableAdapter_1.at(at);
                }, function (item, property) {
                    return adapter_1.forRecord(item).get(property);
                });
            } else {
                // Slow mode: indexing use record instances
                indexer = new Indexer_1.default(this._$items, function (items) {
                    return items.length;
                }, function (items, at) {
                    return _this.at(at);
                }, function (item, property) {
                    return item.get(property);
                });
            }
            this._indexer = indexer;
            return indexer;
        };    // endregion List
              // endregion ObservableList
        // endregion List
        // endregion ObservableList
        RecordSet.prototype._itemsSlice = function (begin, end) {
            if (this._isNeedNotifyCollectionChange()) {
                if (begin === undefined) {
                    begin = 0;
                }
                if (end === undefined) {
                    end = this._$items.length;
                }    // Force create records for event handler
                // Force create records for event handler
                for (var i = begin; i < end; i++) {
                    this._getRecord(i);
                }
            }
            return _super.prototype._itemsSlice.call(this, begin, end);
        };    // endregion ObservableList
              // region SerializableMixin
        // endregion ObservableList
        // region SerializableMixin
        RecordSet.prototype._getSerializableState = function (state) {
            state = ObservableList_1.default.prototype._getSerializableState.call(this, state);
            state = entity_1.FormattableMixin._getSerializableState.call(this, state);
            state._instanceId = this.getInstanceId();
            delete state.$options.items;
            return state;
        };
        RecordSet.prototype._setSerializableState = function (state) {
            var fromSuper = _super.prototype._setSerializableState.call(this, state);
            var fromFormattableMixin = entity_1.FormattableMixin._setSerializableState(state);
            return function () {
                fromSuper.call(this);
                fromFormattableMixin.call(this);
                this._instanceId = state._instanceId;
            };
        };    // endregion SerializableMixin
              // region FormattableMixin
        // endregion SerializableMixin
        // region FormattableMixin
        RecordSet.prototype.setRawData = function (data) {
            var oldItems = this._$items.slice();
            var eventsWasRaised = this._eventRaising;
            this._eventRaising = false;
            this.clear();
            this._eventRaising = eventsWasRaised;
            this._assignRawData(data);
            this._initByRawData();
            this._notifyCollectionChange(IObservable_1.default.ACTION_RESET, this._$items, 0, oldItems, 0);
        };
        RecordSet.prototype.addField = function (format, at, value) {
            format = this._buildField(format);
            entity_1.FormattableMixin.addField.call(this, format, at);
            this._parentChanged(entity_1.Record.prototype.addField);
            if (value !== undefined) {
                var name_1 = format.getName();
                this.each(function (record) {
                    record.set(name_1, value);
                });
            }
            this._nextVersion();
        };
        RecordSet.prototype.removeField = function (name) {
            entity_1.FormattableMixin.removeField.call(this, name);
            this._nextVersion();
            this._parentChanged(entity_1.Record.prototype.removeField);
        };
        RecordSet.prototype.removeFieldAt = function (at) {
            entity_1.FormattableMixin.removeFieldAt.call(this, at);
            this._nextVersion();
            this._parentChanged(entity_1.Record.prototype.removeFieldAt);
        };    /**
         * Создает адаптер для сырых данных
         * @return {Types/_entity/adapter/ITable}
         * @protected
         */
        /**
         * Создает адаптер для сырых данных
         * @return {Types/_entity/adapter/ITable}
         * @protected
         */
        RecordSet.prototype._createRawDataAdapter = function () {
            return this._getAdapter().forTable(this._getRawData(true));
        };    /**
         * Переустанавливает сырые данные
         * @param {Object} data Данные в "сыром" виде
         * @param {Boolean} [keepFormat=false] Сохранить формат
         * @protected
         */
        /**
         * Переустанавливает сырые данные
         * @param {Object} data Данные в "сыром" виде
         * @param {Boolean} [keepFormat=false] Сохранить формат
         * @protected
         */
        RecordSet.prototype._assignRawData = function (data, keepFormat) {
            entity_1.FormattableMixin.setRawData.call(this, data);
            this._clearIndexer();
            if (!keepFormat) {
                this._clearFormat();
            }
            this._nextVersion();
        };    // endregion FormattableMixin
              // region Public methods
              /**
         * Возвращает конструктор записей, порождаемых рекордсетом.
         * @return {String|Function}
         * @see model
         * @see Types/_entity/Model
         * @see Types/di
         * @example
         * Получим конструктор записепй, внедренный в рекордсет в виде названия зарегистрированной зависимости:
         * <pre>
         *    var User = Model.extend({});
         *    Di.register('model.user', User);
         *    //...
         *    var users = new RecordSet({
         *       model: 'model.user'
         *    });
         *    users.getModel() === 'model.user';//true
         * </pre>
         * Получим конструктор записепй, внедренный в рекордсет в виде класса:
         * <pre>
         *    var User = Model.extend({});
         *    //...
         *    var users = new RecordSet({
         *       model: User
         *    });
         *    users.getModel() === User;//true
         * </pre>
         */
        // endregion FormattableMixin
        // region Public methods
        /**
         * Возвращает конструктор записей, порождаемых рекордсетом.
         * @return {String|Function}
         * @see model
         * @see Types/_entity/Model
         * @see Types/di
         * @example
         * Получим конструктор записепй, внедренный в рекордсет в виде названия зарегистрированной зависимости:
         * <pre>
         *    var User = Model.extend({});
         *    Di.register('model.user', User);
         *    //...
         *    var users = new RecordSet({
         *       model: 'model.user'
         *    });
         *    users.getModel() === 'model.user';//true
         * </pre>
         * Получим конструктор записепй, внедренный в рекордсет в виде класса:
         * <pre>
         *    var User = Model.extend({});
         *    //...
         *    var users = new RecordSet({
         *       model: User
         *    });
         *    users.getModel() === User;//true
         * </pre>
         */
        RecordSet.prototype.getModel = function () {
            return this._$model;
        };    /**
         * Подтверждает изменения всех записей с момента предыдущего вызова acceptChanges().
         * Обрабатывает {@link state} записей следующим образом:
         * <ul>
         *    <li>Changed и Added - меняют state на Unchanged;</li>
         *    <li>Deleted - удаляются из рекордсета, а их state становится Detached;</li>
         *    <li>остальные не меняются.</li>
         * </ul>
         * @param {Boolean} [spread=false] Распространять изменения по иерархии родителей (будут вызваны acceptChanges
         * всех владельцев).
         * @example
         * Подтвердим измененную запись:
         * <pre>
         *    require(['Types/collection', 'Types/entity'], function(collection, entity) {
         *       var fruits = new collection.RecordSet({
         *          rawData: [
         *             {name: 'Apple'},
         *             {name: 'Banana'}
         *          ]
         *       });
         *       var RecordState = entity.Record.RecordState;
         *
         *       var apple = fruits.at(0);
         *       apple.set('name', 'Pineapple');
         *       apple.getState() === RecordState.CHANGED;//true
         *
         *       fruits.acceptChanges();
         *       apple.getState() === RecordState.UNCHANGED;//true
         *    });
         * </pre>
         * Подтвердим добавленную запись:
         * <pre>
         *    require(['Types/collection', 'Types/entity'], function(collection, entity) {
         *       var fruits = new collection.RecordSet({
         *          rawData: [
         *             {name: 'Apple'}
         *          ]
         *       });
         *       var RecordState = entity.Record.RecordState;
         *       var banana = new entity.Record({
         *          rawData: {name: 'Banana'}
         *       });
         *
         *       fruits.add(banana);
         *       banana.getState() === RecordState.ADDED;//true
         *
         *       fruits.acceptChanges();
         *       banana.getState() === RecordState.UNCHANGED;//true
         *    });
         * </pre>
         * Подтвердим удаленную запись:
         * <pre>
         *    require(['Types/collection', 'Types/entity'], function(collection, entity) {
         *       var fruits = new collection.RecordSet({
         *          rawData: [
         *             {name: 'Apple'},
         *             {name: 'Banana'}
         *          ]
         *       });
         *       var RecordState = entity.Record.RecordState;
         *
         *       var apple = fruits.at(0);
         *       apple.setState(RecordState.DELETED);
         *       fruits.getCount();//2
         *       fruits.at(0).get('name');//'Apple'
         *
         *       fruits.acceptChanges();
         *       apple.getState() === RecordState.DETACHED;//true
         *       fruits.getCount();//1
         *       fruits.at(0).get('name');//'Banana'
         *    });
         * </pre>
         */
        /**
         * Подтверждает изменения всех записей с момента предыдущего вызова acceptChanges().
         * Обрабатывает {@link state} записей следующим образом:
         * <ul>
         *    <li>Changed и Added - меняют state на Unchanged;</li>
         *    <li>Deleted - удаляются из рекордсета, а их state становится Detached;</li>
         *    <li>остальные не меняются.</li>
         * </ul>
         * @param {Boolean} [spread=false] Распространять изменения по иерархии родителей (будут вызваны acceptChanges
         * всех владельцев).
         * @example
         * Подтвердим измененную запись:
         * <pre>
         *    require(['Types/collection', 'Types/entity'], function(collection, entity) {
         *       var fruits = new collection.RecordSet({
         *          rawData: [
         *             {name: 'Apple'},
         *             {name: 'Banana'}
         *          ]
         *       });
         *       var RecordState = entity.Record.RecordState;
         *
         *       var apple = fruits.at(0);
         *       apple.set('name', 'Pineapple');
         *       apple.getState() === RecordState.CHANGED;//true
         *
         *       fruits.acceptChanges();
         *       apple.getState() === RecordState.UNCHANGED;//true
         *    });
         * </pre>
         * Подтвердим добавленную запись:
         * <pre>
         *    require(['Types/collection', 'Types/entity'], function(collection, entity) {
         *       var fruits = new collection.RecordSet({
         *          rawData: [
         *             {name: 'Apple'}
         *          ]
         *       });
         *       var RecordState = entity.Record.RecordState;
         *       var banana = new entity.Record({
         *          rawData: {name: 'Banana'}
         *       });
         *
         *       fruits.add(banana);
         *       banana.getState() === RecordState.ADDED;//true
         *
         *       fruits.acceptChanges();
         *       banana.getState() === RecordState.UNCHANGED;//true
         *    });
         * </pre>
         * Подтвердим удаленную запись:
         * <pre>
         *    require(['Types/collection', 'Types/entity'], function(collection, entity) {
         *       var fruits = new collection.RecordSet({
         *          rawData: [
         *             {name: 'Apple'},
         *             {name: 'Banana'}
         *          ]
         *       });
         *       var RecordState = entity.Record.RecordState;
         *
         *       var apple = fruits.at(0);
         *       apple.setState(RecordState.DELETED);
         *       fruits.getCount();//2
         *       fruits.at(0).get('name');//'Apple'
         *
         *       fruits.acceptChanges();
         *       apple.getState() === RecordState.DETACHED;//true
         *       fruits.getCount();//1
         *       fruits.at(0).get('name');//'Banana'
         *    });
         * </pre>
         */
        RecordSet.prototype.acceptChanges = function (spread) {
            var toRemove = [];
            this.each(function (record, index) {
                if (record.getState() === RECORD_STATE.DELETED) {
                    toRemove.push(index);
                }
                record.acceptChanges();
            });
            for (var index = toRemove.length - 1; index >= 0; index--) {
                this.removeAt(toRemove[index]);
            }
            if (spread) {
                this._childChanged(entity_1.Record.prototype.acceptChanges);
            }
        };
        RecordSet.prototype.isChanged = function () {
            var changed = false;
            var items = this._$items;
            var count = items.length;
            for (var i = 0; i < count; i++) {
                if (items[i].isChanged()) {
                    changed = true;
                    break;
                }
            }
            return changed;
        };    /**
         * Возвращает название свойства записи, содержащего первичный ключ
         * @return {String}
         * @see setIdProperty
         * @see idProperty
         * @example
         * Получим название свойства, содержащего первичный ключ:
         * <pre>
         *    var users = new RecordSet({
         *       idProperty: 'id'
         *    });
         *    users.getIdProperty();//'id'
         * </pre>
         */
        /**
         * Возвращает название свойства записи, содержащего первичный ключ
         * @return {String}
         * @see setIdProperty
         * @see idProperty
         * @example
         * Получим название свойства, содержащего первичный ключ:
         * <pre>
         *    var users = new RecordSet({
         *       idProperty: 'id'
         *    });
         *    users.getIdProperty();//'id'
         * </pre>
         */
        RecordSet.prototype.getIdProperty = function () {
            return this._$idProperty;
        };    /**
         * Устанавливает название свойства записи, содержащего первичный ключ
         * @param {String} name
         * @see getIdProperty
         * @see idProperty
         * @example
         * Установим название свойства, содержащего первичный ключ:
         * <pre>
         *    var users = new RecordSet({
         *       rawData: [{
         *          id: 134,
         *          login: 'editor',
         *       }, {
         *          id: 257,
         *          login: 'shell',
         *       }]
         *    });
         *    users.setIdProperty('id');
         *    users.getRecordById(257).get('login');//'shell'
         * </pre>
         */
        /**
         * Устанавливает название свойства записи, содержащего первичный ключ
         * @param {String} name
         * @see getIdProperty
         * @see idProperty
         * @example
         * Установим название свойства, содержащего первичный ключ:
         * <pre>
         *    var users = new RecordSet({
         *       rawData: [{
         *          id: 134,
         *          login: 'editor',
         *       }, {
         *          id: 257,
         *          login: 'shell',
         *       }]
         *    });
         *    users.setIdProperty('id');
         *    users.getRecordById(257).get('login');//'shell'
         * </pre>
         */
        RecordSet.prototype.setIdProperty = function (name) {
            if (this._$idProperty === name) {
                return;
            }
            this._$idProperty = name;
            this.each(function (record) {
                if (record.setIdProperty) {
                    record.setIdProperty(name);
                }
            });
            this._notify('onPropertyChange', { idProperty: this._$idProperty });
        };    /**
         * Возвращает запись по ключу.
         * Если записи с таким ключом нет - возвращает undefined.
         * @param {String|Number} id Значение первичного ключа.
         * @return {Types/_entity/Record}
         * @example
         * Создадим рекордсет, получим запись по первичному ключу:
         * <pre>
         *    var users = new RecordSet({
         *       idProperty: 'id'
         *       rawData: [{
         *          id: 134,
         *          login: 'editor',
         *       }, {
         *          id: 257,
         *          login: 'shell',
         *       }]
         *    });
         *    users.getRecordById(257).get('login');//'shell'
         * </pre>
         */
        /**
         * Возвращает запись по ключу.
         * Если записи с таким ключом нет - возвращает undefined.
         * @param {String|Number} id Значение первичного ключа.
         * @return {Types/_entity/Record}
         * @example
         * Создадим рекордсет, получим запись по первичному ключу:
         * <pre>
         *    var users = new RecordSet({
         *       idProperty: 'id'
         *       rawData: [{
         *          id: 134,
         *          login: 'editor',
         *       }, {
         *          id: 257,
         *          login: 'shell',
         *       }]
         *    });
         *    users.getRecordById(257).get('login');//'shell'
         * </pre>
         */
        RecordSet.prototype.getRecordById = function (id) {
            return this.at(this.getIndexByValue(this._$idProperty, id));
        };    /**
         * Возвращает метаданные RecordSet'а.
         * Подробнее о метаданных смотрите в описании опции {@link metaData}.
         * @return {Object} Метаданные.
         * @see metaData
         * @see setMetaData
         */
        /**
         * Возвращает метаданные RecordSet'а.
         * Подробнее о метаданных смотрите в описании опции {@link metaData}.
         * @return {Object} Метаданные.
         * @see metaData
         * @see setMetaData
         */
        RecordSet.prototype.getMetaData = function () {
            var _this = this;
            if (this._metaData) {
                return this._metaData;
            }
            var cast = function (value, format) {
                return entity_1.factory.cast(value, format, {
                    format: format,
                    adapter: _this._getAdapter(),
                    idProperty: _this._$idProperty
                });
            };
            var metaFormat = this._$metaFormat ? entity_1.FormattableMixin._buildFormat(this._$metaFormat) : null;
            var metaData = {};
            if (this._$metaData) {
                if (this._$metaData instanceof Object && Object.getPrototypeOf(this._$metaData) === Object.prototype) {
                    Object.keys(this._$metaData).forEach(function (fieldName) {
                        var fieldValue = _this._$metaData[fieldName];
                        if (metaFormat) {
                            var fieldFormat = void 0;
                            var fieldIndex = metaFormat.getFieldIndex(fieldName);
                            if (fieldIndex > -1) {
                                fieldFormat = metaFormat.at(fieldIndex);
                                fieldValue = cast(fieldValue, fieldFormat.getType());
                            }
                        }
                        metaData[fieldName] = fieldValue;
                    });
                } else {
                    metaData = this._$metaData;
                }
            } else {
                var adapter_2 = this._getRawDataAdapter();    // Unwrap if needed
                // Unwrap if needed
                if (adapter_2['[Types/_entity/adapter/IDecorator]']) {
                    adapter_2 = adapter_2.getOriginal();
                }
                if (adapter_2['[Types/_entity/adapter/IMetaData]']) {
                    adapter_2.getMetaDataDescriptor().forEach(function (format) {
                        var fieldName = format.getName();
                        var fieldFormat;
                        if (metaFormat) {
                            var fieldIndex = metaFormat.getFieldIndex(fieldName);
                            if (fieldIndex > -1) {
                                fieldFormat = metaFormat.at(fieldIndex);
                            }
                        }
                        metaData[fieldName] = cast(adapter_2.getMetaData(fieldName), fieldFormat ? fieldFormat.getType() : _this._getFieldType(format));
                    });
                }
            }
            this._metaData = metaData;
            return this._metaData;
        };    /**
         * Устанавливает метаданные RecordSet'а.
         * Подробнее о метаданных смотрите в описании опции {@link metaData}.
         * <ul>
         * <li>path - путь для хлебных крошек, возвращается как {@link Types/_collection/RecordSet};</li>
         * <li>results - строка итогов, возвращается как {@link Types/_entity/Record}. Подробнее о конфигурации списков для отображения строки итогов читайте в {@link https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/components/list/list-settings/list-visual-display/results/ этом разделе};</li>
         * <li>more - Boolean - есть ли есть записи для подгрузки (используется для постраничной навигации).</li>
         * </ul>
         * @param {Object} meta Метаданные.
         * @see metaData
         * @see getMetaData
         */
        /**
         * Устанавливает метаданные RecordSet'а.
         * Подробнее о метаданных смотрите в описании опции {@link metaData}.
         * <ul>
         * <li>path - путь для хлебных крошек, возвращается как {@link Types/_collection/RecordSet};</li>
         * <li>results - строка итогов, возвращается как {@link Types/_entity/Record}. Подробнее о конфигурации списков для отображения строки итогов читайте в {@link https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/components/list/list-settings/list-visual-display/results/ этом разделе};</li>
         * <li>more - Boolean - есть ли есть записи для подгрузки (используется для постраничной навигации).</li>
         * </ul>
         * @param {Object} meta Метаданные.
         * @see metaData
         * @see getMetaData
         */
        RecordSet.prototype.setMetaData = function (meta) {
            var _this = this;
            this._metaData = this._$metaData = meta;
            if (meta instanceof Object) {
                var adapter_3 = this._getRawDataAdapter();
                if (adapter_3['[Types/_entity/adapter/IMetaData]']) {
                    adapter_3.getMetaDataDescriptor().forEach(function (format) {
                        var name = format.getName();
                        var value = entity_1.factory.serialize(meta[name], {
                            format: format,
                            adapter: _this.getAdapter()
                        });
                        adapter_3.setMetaData(name, value);
                    });
                }
            }
            this._notify('onPropertyChange', { metaData: meta });
        };    /**
         * Объединяет два рекордсета.
         * @param {Types/_collection/RecordSet} recordSet Рекордсет, с которым объединить
         * @param {MergeOptions} options Опции операций
         * @see assign
         * @see append
         * @see prepend
         * @see add
         * @see replace
         * @see remove
         */
        /**
         * Объединяет два рекордсета.
         * @param {Types/_collection/RecordSet} recordSet Рекордсет, с которым объединить
         * @param {MergeOptions} options Опции операций
         * @see assign
         * @see append
         * @see prepend
         * @see add
         * @see replace
         * @see remove
         */
        RecordSet.prototype.merge = function (recordSet, options) {
            // Backward compatibility for 'merge'
            if (options instanceof Object && options.hasOwnProperty('merge') && !options.hasOwnProperty('replace')) {
                options.replace = options.merge;
            }
            options = tslib_1.__assign({
                add: true,
                remove: true,
                replace: true,
                inject: false
            }, options || {});
            var count = recordSet.getCount();
            var idProperty = this._$idProperty;
            var existsIdMap = {};
            var newIdMap = {};
            var toAdd = [];
            var toReplace = [];
            var toInject = [];
            var record;
            var id;
            var index;
            this.each(function (record, index) {
                existsIdMap[record.get(idProperty)] = index;
            });
            for (var i = 0; i < count; i++) {
                record = recordSet.at(i);
                id = record.get(idProperty);
                if (i === 0) {
                    this._checkItem(record);
                }
                if (existsIdMap.hasOwnProperty(id)) {
                    if (options.inject) {
                        index = existsIdMap[id];
                        if (!record.isEqual(this.at(index))) {
                            toInject.push([
                                record,
                                index
                            ]);
                        }
                    } else if (options.replace) {
                        index = existsIdMap[id];
                        if (!record.isEqual(this.at(index))) {
                            toReplace.push([
                                record,
                                index
                            ]);
                        }
                    }
                } else {
                    if (options.add) {
                        toAdd.push(record);
                    }
                }
                if (options.remove) {
                    newIdMap[id] = true;
                }
            }
            if (toReplace.length) {
                for (var i = 0; i < toReplace.length; i++) {
                    this.replace(toReplace[i][0], toReplace[i][1]);
                }
            }
            if (toInject.length) {
                for (var i = 0; i < toInject.length; i++) {
                    record = this.at(toInject[i][1]);
                    record.setRawData(toInject[i][0].getRawData());
                }
            }
            if (toAdd.length) {
                this.append(toAdd);
            }
            if (options.remove) {
                var toRemove_1 = [];
                this.each(function (record, index) {
                    if (!newIdMap.hasOwnProperty(record.get(idProperty))) {
                        toRemove_1.push(index);
                    }
                });
                for (var i = toRemove_1.length - 1; i >= 0; i--) {
                    this.removeAt(toRemove_1[i]);
                }
            }
        };    // endregion Public methods
              // region Protected methods
              /**
         * Вставляет сырые данные записей в сырые данные рекордсета
         * @param {Types/_collection/IEnumerable|Array} items Коллекция записей
         * @param {Number} [at] Позиция вставки
         * @return {Array}
         * @protected
         */
        // endregion Public methods
        // region Protected methods
        /**
         * Вставляет сырые данные записей в сырые данные рекордсета
         * @param {Types/_collection/IEnumerable|Array} items Коллекция записей
         * @param {Number} [at] Позиция вставки
         * @return {Array}
         * @protected
         */
        RecordSet.prototype._addItemsToRawData = function (items, at) {
            var adapter = this._getRawDataAdapter();
            items = this._itemsToArray(items);
            var item;
            for (var i = 0, len = items.length; i < len; i++) {
                item = items[i];
                adapter.add(item.getRawData(true), at === undefined ? undefined : at + i);
            }
            return items;
        };    /**
         * Нормализует записи при добавлении в рекордсет: клонирует и приводит к формату рекордсета
         * @param {Array.<Types/_entity/Record>} items Записи
         * @param {RecordState} [state] С каким состояним создать
         * @return {Array.<Types/_entity/Record>}
         * @protected
         */
        /**
         * Нормализует записи при добавлении в рекордсет: клонирует и приводит к формату рекордсета
         * @param {Array.<Types/_entity/Record>} items Записи
         * @param {RecordState} [state] С каким состояним создать
         * @return {Array.<Types/_entity/Record>}
         * @protected
         */
        RecordSet.prototype._normalizeItems = function (items, state) {
            var formatDefined = this._hasFormat();
            var format;
            var result = [];
            var resultItem;
            var item;
            for (var i = 0; i < items.length; i++) {
                item = items[i];
                this._checkItem(item);
                if (!formatDefined && this.getCount() === 0) {
                    format = item.getFormat(true);
                    this._clearFormat();
                    this._resetRawDataFields();
                } else if (!format) {
                    format = this._getFormat(true);
                }
                resultItem = this._normalizeItemData(item, format);
                if (state) {
                    resultItem.setState(state);
                }
                result.push(resultItem);
            }
            return result;
        };    /**
         * Возращает копию записи с сырыми данными, приведенными к нужному формату
         * @param {Array.<Types/_entity/Record>} item Запись
         * @param {Types/_entity/format/Format} format Формат, к которому следует привести данные
         * @return {Array.<Types/_entity/Record>}
         * @protected
         */
        /**
         * Возращает копию записи с сырыми данными, приведенными к нужному формату
         * @param {Array.<Types/_entity/Record>} item Запись
         * @param {Types/_entity/format/Format} format Формат, к которому следует привести данные
         * @return {Array.<Types/_entity/Record>}
         * @protected
         */
        RecordSet.prototype._normalizeItemData = function (item, format) {
            var itemFormat = item.getFormat(true);
            var result;
            if (format.isEqual(itemFormat)) {
                result = this._buildRecord(item.getRawData());
            } else {
                var adapter_4 = this.getAdapter().forRecord(null, this._getRawData());
                var itemAdapter_1 = item.getAdapter().forRecord(item.getRawData(true));
                format.each(function (field, index) {
                    var name = field.getName();
                    adapter_4.addField(field, index);
                    adapter_4.set(name, itemAdapter_1.get(name));
                });
                result = this._buildRecord(adapter_4.getData());
            }
            return result;
        };    /**
         * Проверяет, что переданный элемент - это запись с идентичным форматом
         * @param {*} item Запись
         * @protected
         */
        /**
         * Проверяет, что переданный элемент - это запись с идентичным форматом
         * @param {*} item Запись
         * @protected
         */
        RecordSet.prototype._checkItem = function (item) {
            if (!item || !item['[Types/_entity/Record]']) {
                throw new TypeError('Item should be an instance of Types/entity:Record');
            }
            checkNullId(item, this.getIdProperty());
            this._checkAdapterCompatibility(item.getAdapter());
        };    /**
         * Создает новый экземпляр модели
         * @param {*} data Данные модели
         * @return {Types/_entity/Record}
         * @protected
         */
        /**
         * Создает новый экземпляр модели
         * @param {*} data Данные модели
         * @return {Types/_entity/Record}
         * @protected
         */
        RecordSet.prototype._buildRecord = function (data) {
            var record = di_1.create(this._$model, {
                owner: this,
                writable: this.writable,
                state: RECORD_STATE.UNCHANGED,
                adapter: this.getAdapter(),
                rawData: data,
                idProperty: this._$idProperty
            });
            return record;
        };    /**
         * Возвращает запись по индексу
         * @param {Number} at Индекс
         * @return {Types/_entity/Record}
         * @protected
         */
        /**
         * Возвращает запись по индексу
         * @param {Number} at Индекс
         * @return {Types/_entity/Record}
         * @protected
         */
        RecordSet.prototype._getRecord = function (at) {
            var _this = this;
            if (at < 0 || at >= this._$items.length) {
                return undefined;
            }
            var record = this._$items[at];
            if (!record) {
                var adapter_5 = this._getRawDataAdapter();
                record = this._$items[at] = this._buildRecord(function () {
                    return adapter_5.at(record ? _this.getIndex(record) : at);
                });
                this._addChild(record);
                checkNullId(record, this.getIdProperty());
            }
            return record;
        };    /**
         * Пересоздает элементы из сырых данных
         * @param {Object} data Сырые данные
         * @protected
         */
        /**
         * Пересоздает элементы из сырых данных
         * @param {Object} data Сырые данные
         * @protected
         */
        RecordSet.prototype._initByRawData = function () {
            var adapter = this._getRawDataAdapter();
            this._$items.length = 0;
            this._$items.length = adapter.getCount();
        };
        return RecordSet;
    }(util_1.mixin(ObservableList_1.default, entity_1.FormattableMixin, entity_1.InstantiableMixin));
    exports.default = RecordSet;
    Object.assign(RecordSet.prototype, {
        '[Types/_collection/RecordSet]': true,
        '[Types/_entity/IInstantiable]': true,
        '[Types/_entity/IObservableObject]': true,
        '[Types/_entity/IProducible]': true,
        _moduleName: 'Types/collection:RecordSet',
        _instancePrefix: 'recordset-',
        _defaultModel: DEFAULT_MODEL,
        _$model: DEFAULT_MODEL,
        _$idProperty: '',
        _$metaData: null,
        _$metaFormat: null,
        _metaData: null
    });    // Aliases
    // Aliases
    RecordSet.prototype.forEach = RecordSet.prototype.each;    // FIXME: backward compatibility for check via Core/core-instance::instanceOfModule()
    // FIXME: backward compatibility for check via Core/core-instance::instanceOfModule()
    RecordSet.prototype['[WS.Data/Collection/RecordSet]'] = true;
    di_1.register('Types/collection:RecordSet', RecordSet, { instantiate: false });
});