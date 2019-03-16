/// <amd-module name="Types/_entity/Model" />
/**
 * Абстрактная модель.
 * Модели обеспечивают доступ к данным и поведению объектов предметной области (сущностям).
 * Такими сущностями могут быть, например, товары, пользователи, документы - и другие предметы окружающего мира, которые вы моделируете в своем приложении.
 *
 * В основе абстрактной модели лежит {@link Types/_entity/Record запись}.
 * Основные аспекты модели (дополнительно к аспектам записи):
 * <ul>
 *    <li>определение {@link properties собственных свойств} сущности;</li>
 *    <li>{@link getId уникальный идентификатор сущности} среди ей подобных.</li>
 * </ul>
 *
 * Поведенческие аспекты каждой сущности реализуются ее прикладным модулем в виде публичных методов.
 * Прикладные модели могут внедряться в порождающие их объекты, такие как {@link Types/_source/ISource#model источники данных} или {@link Types/_collection/RecordSet#model рекордсеты}.
 *
 * Для реализации конкретной модели используется наследование от абстрактной либо промежуточной.
 *
 * Для корректной сериализации и клонирования моделей необходимо выносить их в отдельные модули и указывать имя модуля в свойстве _moduleName каждого наследника:
 * <pre>
 *    //My/Awesome/Model.ts
 *    import {Model} from 'Types/entity';
 *    export default class AwesomeModel extends Model {
 *       _moduleName: string = 'My/Awesome/Model';
 *       //...
 *    });
 *
 *    return AwesomeModel;
 * </pre>
 *
 * Определим модель пользователя:
 * <pre>
 *    //My/Awesome/Model.ts
 *    import {Salt} from 'Application/Lib';
 *    import {Model} from 'Types/entity';
 *    export default class User extends Model{
 *       _moduleName: string = 'Application/Model/User';
 *       _$format: Array = [
 *          {name: 'login', type: 'string'},
 *          {name: 'salt', type: 'string'}
 *       ];
 *       _$idProperty: string = 'login';
 *       authenticate(password: string): boolean {
 *          return Salt.encode(this.get('login') + ':' + password) === this.get('salt');
 *       }
 *     });
 * </pre>
 * Создадим модель пользователя:
 * <pre>
 *    //Application/Controller/Test/Auth.ts
 *    import User from 'Application/Model/User';
 *    const user = new User();
 *    user.set({
 *       login: 'i.c.wiener',
 *       salt: 'grhS2Nys345fsSW3mL9'
 *    });
 *    const testOk = user.authenticate('its pizza time!');
 * </pre>
 *
 * Модели могут объединяться по принципу "матрёшки" - сырыми данными одной модели является другая модель. Для организации такой структуры следует использовать {@link Types/_entity/adapter/RecordSet адаптер рекордсета}:
 * <pre>
 *    var MyEngine, MyTransmission, myCar;
 *
 *    MyEngine = Model.extend({
 *       _$properties: {
 *          fuelType: {
 *             get: function() {
 *                return 'Diesel';
 *             }
 *          }
 *       }
 *    });
 *
 *    MyTransmission = Model.extend({
 *       _$properties: {
 *          transmissionType: {
 *             get: function() {
 *                return 'Manual';
 *             }
 *          }
 *       }
 *    });
 *
 *    myCar = new MyEngine({
 *       rawData: new MyTransmission({
 *          rawData: {
 *             color: 'Red',
 *             fuelType: '',
 *             transmissionType: ''
 *          }
 *       }),
 *       adapter: new RecordSetAdapter()
 *   });
 *
 *   myCar.get('fuelType');//'Diesel'
 *   myCar.get('transmissionType');//'Manual'
 *   myCar.get('color');//'Red'
 * </pre>
 * @class Types/_entity/Model
 * @extends Types/_entity/Record
 * @implements Types/_entity/IInstantiable
 * @mixes Types/_entity/InstantiableMixin
 * @public
 * @ignoreMethods getDefault
 * @author Мальцев А.А.
 */
define('Types/_entity/Model', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/Record',
    'Types/_entity/InstantiableMixin',
    'Types/_entity/functor',
    'Types/di',
    'Types/util',
    'Types/shim'
], function (require, exports, tslib_1, Record_1, InstantiableMixin_1, functor_1, di_1, util_1, shim_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Separator for path in object
     */
    /**
     * Separator for path in object
     */
    var ROUTE_SEPEARTOR = '.';
    var Model = /** @class */
    function (_super) {
        tslib_1.__extends(Model, _super);
        function Model(options) {
            var _this = _super.call(this, options) || this;    // TODO: don't allow to inject properties through constructor
            // TODO: don't allow to inject properties through constructor
            _this._propertiesInjected = options && 'properties' in options;    // FIXME: backward compatibility for _options
            // FIXME: backward compatibility for _options
            if (_this._options) {
                // for _$properties
                if (_this._options.properties) {
                    var properties = {};
                    Object.assign(properties, _this._$properties);
                    Object.assign(properties, _this._options.properties);
                    _this._$properties = properties;
                }    // for _$idProperty
                // for _$idProperty
                if (_this._options.idProperty) {
                    _this._$idProperty = _this._options.idProperty;
                }
            }
            if (!_this._$idProperty) {
                _this._$idProperty = _this._getAdapter().getKeyField(_this._getRawData()) || '';
            }
            return _this;
        }    // endregion
             // region Statics
        // endregion
        // region Statics
        Model.fromObject = function (data, adapter) {
            var record = Record_1.default.fromObject(data, adapter);
            if (!record) {
                return record;
            }
            return new Model({
                rawData: record.getRawData(true),
                adapter: record.getAdapter(),
                //@ts-ignore
                format: record._getFormat(true)    // "Anakin, I Am Your Son"
            });
        };    // endregion
              // region Deprecated
              /**
         * @deprecated
         */
        // "Anakin, I Am Your Son"
        // endregion
        // region Deprecated
        /**
         * @deprecated
         */
        Model.extend = function (mixinsList, classExtender) {
            util_1.logger.info('Types/_entity/Model', 'Method extend is deprecated, use ES6 extends or Core/core-extend');
            if (!require.defined('Core/core-extend')) {
                throw new ReferenceError('You should require module "Core/core-extend" to use old-fashioned "Types/_entity/Model::extend()" method.');
            }
            var coreExtend = require('Core/core-extend');
            return coreExtend(this, mixinsList, classExtender);
        };
        Model.prototype.destroy = function () {
            this._defaultPropertiesValues = null;
            this._propertiesDependency = null;
            this._calculatingProperties = null;
            this._deepChangedProperties = null;
            _super.prototype.destroy.call(this);
        };    // region IObject
        // region IObject
        Model.prototype.get = function (name) {
            this._pushDependency(name);
            if (this._fieldsCache.has(name)) {
                return this._fieldsCache.get(name);
            }
            var property = this._$properties && this._$properties[name];
            var superValue = _super.prototype.get.call(this, name);
            if (!property) {
                return superValue;
            }
            var preValue = superValue;
            if ('def' in property && !this._getRawDataAdapter().has(name)) {
                preValue = this.getDefault(name);
            }
            if (!property.get) {
                return preValue;
            }
            var value = this._processCalculatedValue(name, preValue, property, true);
            if (value !== superValue) {
                this._removeChild(superValue);
                this._addChild(value, this._getRelationNameForField(name));
            }
            if (this._isFieldValueCacheable(value)) {
                this._fieldsCache.set(name, value);
            } else if (this._fieldsCache.has(name)) {
                this._fieldsCache.delete(name);
            }
            return value;
        };
        Model.prototype.set = function (name, value) {
            var _this = this;
            if (!this._$properties) {
                _super.prototype.set.call(this, name, value);
                return;
            }
            var map = this._getHashMap(name, value);
            var pairs = [];
            var propertiesErrors = [];
            var isCalculating = this._calculatingProperties ? this._calculatingProperties.size > 0 : false;
            Object.keys(map).forEach(function (key) {
                _this._deleteDependencyCache(key);    // Try to set every property
                // Try to set every property
                var value = map[key];
                try {
                    var property = _this._$properties && _this._$properties[key];
                    if (property) {
                        if (property.set) {
                            // Remove cached value
                            if (_this._fieldsCache.has(key)) {
                                _this._removeChild(_this._fieldsCache.get(key));
                                _this._fieldsCache.delete(key);
                            }
                            value = _this._processCalculatedValue(key, value, property, false);
                            if (value === undefined) {
                                return;
                            }
                        } else if (property.get) {
                            propertiesErrors.push(new ReferenceError('Property "' + key + '" is read only'));
                            return;
                        }
                    }
                    pairs.push([
                        key,
                        value,
                        _this._getRawDataValue(key)
                    ]);
                } catch (err) {
                    // Collecting errors for every property
                    propertiesErrors.push(err);
                }
            });    // Collect pairs of properties
            // Collect pairs of properties
            var pairsErrors = [];
            var changedProperties = _super.prototype._setPairs.call(this, pairs, pairsErrors);
            if (isCalculating && changedProperties) {
                // Here is the set() that recursive calls from another set() so just accumulate the changes
                this._deepChangedProperties = this._deepChangedProperties || {};
                Object.assign(this._deepChangedProperties, changedProperties);
            } else if (!isCalculating && this._deepChangedProperties) {
                // Here is the top level set() so do merge with accumulated changes
                if (changedProperties) {
                    Object.assign(this._deepChangedProperties, changedProperties);
                }
                changedProperties = this._deepChangedProperties;
                this._deepChangedProperties = null;
            }    // It's top level set() so notify changes if have some
            // It's top level set() so notify changes if have some
            if (!isCalculating && changedProperties) {
                var changed = Object.keys(changedProperties).reduce(function (memo, key) {
                    memo[key] = _this.get(key);
                    return memo;
                }, {});
                this._notifyChange(changed);
            }
            this._checkErrors(propertiesErrors.concat(pairsErrors));
        };
        Model.prototype.has = function (name) {
            return this._$properties && this._$properties.hasOwnProperty(name) || _super.prototype.has.call(this, name);
        };    // endregion
              // region IEnumerable
              /**
         * Возвращает энумератор для перебора названий свойств модели
         * @return {Types/_collection/ArrayEnumerator}
         * @example
         * Смотри пример {@link Types/_entity/Record#getEnumerator для записи}:
         */
        // endregion
        // region IEnumerable
        /**
         * Возвращает энумератор для перебора названий свойств модели
         * @return {Types/_collection/ArrayEnumerator}
         * @example
         * Смотри пример {@link Types/_entity/Record#getEnumerator для записи}:
         */
        Model.prototype.getEnumerator = function () {
            return di_1.create('Types/collection:enumerator.Arraywise', this._getAllProperties());
        };    /**
         * Перебирает все свойства модели (включая имеющиеся в "сырых" данных)
         * @param {Function(String, *)} callback Ф-я обратного вызова для каждого свойства. Первым аргументом придет название свойства, вторым - его значение.
         * @param {Object} [context] Контекст вызова callback.
         * @example
         * Смотри пример {@link Types/_entity/Record#each для записи}:
         */
        /**
         * Перебирает все свойства модели (включая имеющиеся в "сырых" данных)
         * @param {Function(String, *)} callback Ф-я обратного вызова для каждого свойства. Первым аргументом придет название свойства, вторым - его значение.
         * @param {Object} [context] Контекст вызова callback.
         * @example
         * Смотри пример {@link Types/_entity/Record#each для записи}:
         */
        Model.prototype.each = function (callback, context) {
            return _super.prototype.each.call(this, callback, context);
        };    // endregion
              // region IReceiver
        // endregion
        // region IReceiver
        Model.prototype.relationChanged = function (which, route) {
            var _this = this;    // Delete cache for properties related of changed one use in-deep route
            // Delete cache for properties related of changed one use in-deep route
            var curr = [];
            var routeLastIndex = route.length - 1;
            route.forEach(function (name, index) {
                var fieldName = _this._getFieldFromRelationName(name);
                curr.push(fieldName);
                if (fieldName) {
                    _this._deleteDependencyCache(curr.join(ROUTE_SEPEARTOR));
                    if (index === routeLastIndex && which.data instanceof Object) {
                        Object.keys(which.data).forEach(function (key) {
                            _this._deleteDependencyCache(curr.concat([key]).join(ROUTE_SEPEARTOR));
                        });
                    }
                }
            });
            return _super.prototype.relationChanged.call(this, which, route);
        };    // endregion
              // region SerializableMixin
        // endregion
        // region SerializableMixin
        Model.prototype._getSerializableState = function (state) {
            state = _super.prototype._getSerializableState.call(this, state);    // Properties are owned by class, not by instance
            // Properties are owned by class, not by instance
            if (!this._propertiesInjected) {
                delete state.$options.properties;
            }
            state._instanceId = this.getInstanceId();
            state._isDeleted = this._isDeleted;
            if (this._defaultPropertiesValues) {
                state._defaultPropertiesValues = this._defaultPropertiesValues;
            }
            return state;
        };
        Model.prototype._setSerializableState = function (state) {
            var fromSuper = _super.prototype._setSerializableState.call(this, state);
            return function () {
                fromSuper.call(this);
                this._instanceId = state._instanceId;
                this._isDeleted = state._isDeleted;
                if (state._defaultPropertiesValues) {
                    this._defaultPropertiesValues = state._defaultPropertiesValues;
                }
            };
        };    // endregion
              // region Record
        // endregion
        // region Record
        Model.prototype.rejectChanges = function (fields, spread) {
            _super.prototype.rejectChanges.call(this, fields, spread);
            if (!(fields instanceof Array)) {
                this._isChanged = false;
            }
        };
        Model.prototype.acceptChanges = function (fields, spread) {
            _super.prototype.acceptChanges.call(this, fields, spread);
            if (!(fields instanceof Array)) {
                this._isChanged = false;
            }
        };
        Model.prototype.isChanged = function (name) {
            if (!name && this._isChanged) {
                return true;
            }
            return _super.prototype.isChanged.call(this, name);
        };    // endregion
              // region Public methods
              /**
         * Возвращает описание свойств модели.
         * @return {Object.<Property>}
         * @see properties
         * @see Property
         * @example
         * Получим описание свойств модели:
         * <pre>
         *    var User = Model.extend({
         *          _$properties: {
         *             id: {
         *                get: function() {
         *                   this._id;
         *                },
         *                set: function(value) {
         *                   this._id = value;
         *                }
         *             },
         *             group: {
         *                get: function() {
         *                   this._group;
         *                }
         *             }
         *          },
         *          _id: 0
         *          _group: null
         *       }),
         *       user = new User();
         *
         *    user.getProperties();//{id: {get: Function, set: Function}, group: {get: Function}}
         * </pre>
         */
        // endregion
        // region Public methods
        /**
         * Возвращает описание свойств модели.
         * @return {Object.<Property>}
         * @see properties
         * @see Property
         * @example
         * Получим описание свойств модели:
         * <pre>
         *    var User = Model.extend({
         *          _$properties: {
         *             id: {
         *                get: function() {
         *                   this._id;
         *                },
         *                set: function(value) {
         *                   this._id = value;
         *                }
         *             },
         *             group: {
         *                get: function() {
         *                   this._group;
         *                }
         *             }
         *          },
         *          _id: 0
         *          _group: null
         *       }),
         *       user = new User();
         *
         *    user.getProperties();//{id: {get: Function, set: Function}, group: {get: Function}}
         * </pre>
         */
        Model.prototype.getProperties = function () {
            return this._$properties;
        };    /**
         * Возвращает значение свойства по умолчанию
         * @param {String} name Название свойства
         * @return {*}
         * @example
         * Получим дефолтное значение свойства id:
         * <pre>
         *    var User = Model.extend({
         *          _$properties: {
         *             id: {
         *                get: function() {
         *                   this._id;
         *                },
         *                def: function(value) {
         *                   return Date.now();
         *                }
         *             }
         *          },
         *          _id: 0
         *       }),
         *       user = new User();
         *
         *    user.getDefault('id');//1466419984715
         *    setTimeout(function(){
         *       user.getDefault('id');//1466419984715
         *    }, 100);
         * </pre>
         */
        /**
         * Возвращает значение свойства по умолчанию
         * @param {String} name Название свойства
         * @return {*}
         * @example
         * Получим дефолтное значение свойства id:
         * <pre>
         *    var User = Model.extend({
         *          _$properties: {
         *             id: {
         *                get: function() {
         *                   this._id;
         *                },
         *                def: function(value) {
         *                   return Date.now();
         *                }
         *             }
         *          },
         *          _id: 0
         *       }),
         *       user = new User();
         *
         *    user.getDefault('id');//1466419984715
         *    setTimeout(function(){
         *       user.getDefault('id');//1466419984715
         *    }, 100);
         * </pre>
         */
        Model.prototype.getDefault = function (name) {
            var defaultPropertiesValues = this._defaultPropertiesValues;
            if (!defaultPropertiesValues) {
                defaultPropertiesValues = this._defaultPropertiesValues = {};
            }
            if (!defaultPropertiesValues.hasOwnProperty(name)) {
                var property = this._$properties[name];
                if (property && 'def' in property) {
                    defaultPropertiesValues[name] = [property.def instanceof Function ? property.def.call(this) : property.def];
                } else {
                    defaultPropertiesValues[name] = [];
                }
            }
            return defaultPropertiesValues[name][0];
        };    /**
         * Объединяет модель с данными другой модели
         * @param {Types/_entity/Model} model Модель, с которой будет произведено объединение
         * @example
         * Объединим модели пользователя и группы пользователей:
         * <pre>
         *    var user = new Model({
         *          rawData: {
         *             id: 1,
         *             login: 'user1',
         *             group_id: 3
         *          }
         *       }),
         *       userGroup = new Model({
         *          rawData: {
         *             group_id: 3,
         *             group_name: 'Domain Users',
         *             group_members: 126
         *          }
         *       });
         *
         *    user.merge(userGroup);
         *    user.get('id');//1
         *    user.get('group_id');//3
         *    user.get('group_name');//'Domain Users'
         * </pre>
         */
        /**
         * Объединяет модель с данными другой модели
         * @param {Types/_entity/Model} model Модель, с которой будет произведено объединение
         * @example
         * Объединим модели пользователя и группы пользователей:
         * <pre>
         *    var user = new Model({
         *          rawData: {
         *             id: 1,
         *             login: 'user1',
         *             group_id: 3
         *          }
         *       }),
         *       userGroup = new Model({
         *          rawData: {
         *             group_id: 3,
         *             group_name: 'Domain Users',
         *             group_members: 126
         *          }
         *       });
         *
         *    user.merge(userGroup);
         *    user.get('id');//1
         *    user.get('group_id');//3
         *    user.get('group_name');//'Domain Users'
         * </pre>
         */
        Model.prototype.merge = function (model) {
            try {
                var modelData_1 = {};
                model.each(function (key, val) {
                    modelData_1[key] = val;
                });
                this.set(modelData_1);
            } catch (e) {
                if (e instanceof ReferenceError) {
                    util_1.logger.info(this._moduleName + '::merge(): ' + e.toString());
                } else {
                    throw e;
                }
            }
        };    /**
         * Возвращает значение первичного ключа модели
         * @return {*}
         * @see idProperty
         * @see getIdProperty
         * @see setIdProperty
         * @example
         * Получим значение первичного ключа статьи:
         * <pre>
         *    var article = new Model({
         *       idProperty: 'id',
         *       rawData: {
         *          id: 1,
         *          title: 'How to make a Model'
         *       }
         *    });
         *    article.getId();//1
         * </pre>
         */
        /**
         * Возвращает значение первичного ключа модели
         * @return {*}
         * @see idProperty
         * @see getIdProperty
         * @see setIdProperty
         * @example
         * Получим значение первичного ключа статьи:
         * <pre>
         *    var article = new Model({
         *       idProperty: 'id',
         *       rawData: {
         *          id: 1,
         *          title: 'How to make a Model'
         *       }
         *    });
         *    article.getId();//1
         * </pre>
         */
        Model.prototype.getId = function () {
            var idProperty = this.getIdProperty();
            if (!idProperty) {
                util_1.logger.info(this._moduleName + '::getId(): idProperty is not defined');
                return undefined;
            }
            return this.get(idProperty);
        };    /**
         * Возвращает название свойства, в котором хранится первичный ключ модели
         * @return {String}
         * @see idProperty
         * @see setIdProperty
         * @see getId
         * @example
         * Получим название свойства первичного ключа:
         * <pre>
         *    var article = new Model({
         *       idProperty: 'id',
         *       rawData: {
         *          id: 1,
         *          title: 'How to make a Model'
         *       }
         *    });
         *    article.getIdProperty();//'id'
         * </pre>
         */
        /**
         * Возвращает название свойства, в котором хранится первичный ключ модели
         * @return {String}
         * @see idProperty
         * @see setIdProperty
         * @see getId
         * @example
         * Получим название свойства первичного ключа:
         * <pre>
         *    var article = new Model({
         *       idProperty: 'id',
         *       rawData: {
         *          id: 1,
         *          title: 'How to make a Model'
         *       }
         *    });
         *    article.getIdProperty();//'id'
         * </pre>
         */
        Model.prototype.getIdProperty = function () {
            return this._$idProperty;
        };    /**
         * Устанавливает название свойства, в котором хранится первичный ключ модели
         * @param {String} idProperty Название свойства для первичного ключа модели.
         * @see idProperty
         * @see getIdProperty
         * @see getId
         * @example
         * Зададим название свойства первичного ключа:
         * <pre>
         *    var article = new Model({
         *       rawData: {
         *          id: 1,
         *          title: 'How to make a Model'
         *       }
         *    });
         *    article.setIdProperty('id');
         *    article.getId();//1
         * </pre>
         */
        /**
         * Устанавливает название свойства, в котором хранится первичный ключ модели
         * @param {String} idProperty Название свойства для первичного ключа модели.
         * @see idProperty
         * @see getIdProperty
         * @see getId
         * @example
         * Зададим название свойства первичного ключа:
         * <pre>
         *    var article = new Model({
         *       rawData: {
         *          id: 1,
         *          title: 'How to make a Model'
         *       }
         *    });
         *    article.setIdProperty('id');
         *    article.getId();//1
         * </pre>
         */
        Model.prototype.setIdProperty = function (idProperty) {
            if (idProperty && !this.has(idProperty)) {
                util_1.logger.info(this._moduleName + '::setIdProperty(): property "' + idProperty + '" is not defined');
                return;
            }
            this._$idProperty = idProperty;
        };    // endregion
              // region Protected methods
              /**
         * Возвращает массив названий всех свойств (включая свойства в "сырых" данных)
         * @return {Array.<String>}
         * @protected
         */
        // endregion
        // region Protected methods
        /**
         * Возвращает массив названий всех свойств (включая свойства в "сырых" данных)
         * @return {Array.<String>}
         * @protected
         */
        Model.prototype._getAllProperties = function () {
            var fields = this._getRawDataFields();
            if (!this._$properties) {
                return fields;
            }
            var objProps = this._$properties;
            var props = Object.keys(objProps);
            return props.concat(fields.filter(function (field) {
                return !objProps.hasOwnProperty(field);
            }));
        };    /**
         * Вычисляет/записывает значение свойства
         * @param {String} name Имя свойства
         * @param {*} value Значение свойства
         * @param {Property} property Описание свойства
         * @param {Boolean} isReading Вычисление или запись
         * @return {*}
         * @protected
         */
        /**
         * Вычисляет/записывает значение свойства
         * @param {String} name Имя свойства
         * @param {*} value Значение свойства
         * @param {Property} property Описание свойства
         * @param {Boolean} isReading Вычисление или запись
         * @return {*}
         * @protected
         */
        Model.prototype._processCalculatedValue = function (name, value, property, isReading) {
            var _this = this;    // Check for recursive calculating
            // Check for recursive calculating
            var calculatingProperties = this._calculatingProperties;
            if (!calculatingProperties) {
                calculatingProperties = this._calculatingProperties = new shim_1.Set();
            }
            var checkKey = name + '|' + isReading;
            if (calculatingProperties.has(checkKey)) {
                throw new Error('Recursive value ' + (isReading ? 'reading' : 'writing') + ' detected for property "' + name + '"');
            }    // Initial conditions
            // Initial conditions
            var method = isReading ? property.get : property.set;
            var isFunctor = isReading && functor_1.Compute.isFunctor(method);
            var doGathering = isReading && !isFunctor;    // Automatic dependencies gathering
            // Automatic dependencies gathering
            var prevGathering;
            if (isReading) {
                prevGathering = this._propertiesDependencyGathering;
                this._propertiesDependencyGathering = doGathering ? name : '';
            }    // Save user defined dependencies
            // Save user defined dependencies
            if (isFunctor) {
                method.properties.forEach(function (dependFor) {
                    _this._pushDependencyFor(dependFor, name);
                });
            }    // Get or set property value
            // Get or set property value
            try {
                calculatingProperties.add(checkKey);
                value = method.call(this, value);
            } finally {
                if (isReading) {
                    this._propertiesDependencyGathering = prevGathering;
                }
                calculatingProperties.delete(checkKey);
            }
            return value;
        };    /**
         * Добавляет зависимое свойство для текущего рассчитываемого
         * @param {String} name Название свойства.
         * @protected
         */
        /**
         * Добавляет зависимое свойство для текущего рассчитываемого
         * @param {String} name Название свойства.
         * @protected
         */
        Model.prototype._pushDependency = function (name) {
            if (this._propertiesDependencyGathering && this._propertiesDependencyGathering !== name) {
                this._pushDependencyFor(name, this._propertiesDependencyGathering);
            }
        };    /**
         * Добавляет зависимое свойство
         * @param {String} name Название свойства.
         * @param {String} dependFor Название свойства, котороое зависит от name
         * @protected
         */
        /**
         * Добавляет зависимое свойство
         * @param {String} name Название свойства.
         * @param {String} dependFor Название свойства, котороое зависит от name
         * @protected
         */
        Model.prototype._pushDependencyFor = function (name, dependFor) {
            var propertiesDependency = this._propertiesDependency;
            if (!propertiesDependency) {
                propertiesDependency = this._propertiesDependency = new shim_1.Map();
            }
            var data;
            if (propertiesDependency.has(name)) {
                data = propertiesDependency.get(name);
            } else {
                data = new shim_1.Set();
                propertiesDependency.set(name, data);
            }
            if (!data.has(dependFor)) {
                data.add(dependFor);
            }
        };    /**
         * Удаляет закешированное значение для свойства и всех от него зависимых свойств
         * @param {String} name Название свойства.
         * @protected
         */
        /**
         * Удаляет закешированное значение для свойства и всех от него зависимых свойств
         * @param {String} name Название свойства.
         * @protected
         */
        Model.prototype._deleteDependencyCache = function (name) {
            var _this = this;
            var propertiesDependency = this._propertiesDependency;
            if (propertiesDependency && propertiesDependency.has(name)) {
                propertiesDependency.get(name).forEach(function (related) {
                    _this._removeChild(_this._fieldsCache.get(related));
                    _this._fieldsCache.delete(related);
                    _this._fieldsClone.delete(related);
                    _this._deleteDependencyCache(related);
                });
            }
        };
        return Model;
    }(util_1.mixin(Record_1.default, InstantiableMixin_1.default));
    exports.default = Model;
    Object.assign(Model.prototype, {
        '[Types/_entity/Model]': true,
        '[Types/_entity/IInstantiable]': true,
        _moduleName: 'Types/entity:Model',
        _instancePrefix: 'model-',
        _$properties: null,
        _$idProperty: '',
        _isDeleted: false,
        _defaultPropertiesValues: null,
        _propertiesDependency: null,
        _propertiesDependencyGathering: '',
        _calculatingProperties: null,
        _deepChangedProperties: null
    });    // FIXME: backward compatibility for check via Core/core-instance::instanceOfModule()
    // FIXME: backward compatibility for check via Core/core-instance::instanceOfModule()
    Model.prototype['[WS.Data/Entity/Model]'] = true;    // FIXME: backward compatibility for Core/core-extend: Model should have exactly its own property 'produceInstance'
                                                         // @ts-ignore
    // FIXME: backward compatibility for Core/core-extend: Model should have exactly its own property 'produceInstance'
    // @ts-ignore
    Model.produceInstance = Record_1.default.produceInstance;
    di_1.register('Types/entity:Model', Model, { instantiate: false });    // FIXME: deprecated
    // FIXME: deprecated
    di_1.register('entity.model', Model);
});