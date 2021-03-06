/// <amd-module name="Types/_entity/Record" />
/**
 * Запись - обертка над данными, которые представлены в виде строки таблицы (объект с набором полей и их значений).
 *
 * Основные аспекты записи:
 * <ul>
 *    <li>одинаковый интерфейс доступа к данным в различных форматах (так называемые {@link rawData "сырые данные"}),
 *        например таких как JSON, СБИС-JSON или XML. За определение аспекта отвечает интерфейс
 *        {@link Types/_entity/IObject};
 *    </li>
 *    <li>одинаковый интерфейс доступа к набору полей. За определение аспекта отвечает интерфейс
 *        {@link Types/_collection/IEnumerable};
 *    </li>
 *    <li>манипуляции с форматом полей. За реализацию аспекта отвечает примесь {@link Types/_entity/FormattableMixin};
 *    </li>
 *    <li>манипуляции с сырыми данными посредством адаптера. За реализацию аспекта отвечает примесь
 *        {@link Types/_entity/FormattableMixin}.
 *    </li>
 * </ul>
 *
 * Создадим запись, в которой в качестве сырых данных используется plain JSON (адаптер для данных в таком формате
 * используется по умолчанию):
 * <pre>
 *    require(['Types/entity'], function (entity) {
 *       var employee = new entity.Record({
 *          rawData: {
 *             id: 1,
 *             firstName: 'John',
 *             lastName: 'Smith'
 *          }
 *       });
 *       employee.get('id');//1
 *       employee.get('firstName');//John
 *    });
 * </pre>
 * Создадим запись, в которой в качестве сырых данных используется ответ БЛ СБИС (адаптер для данных в таком формате
 * укажем явно):
 * <pre>
 *    require([
 *       'Types/entity',
 *       'Types/source'
 *    ], function (entity, source) {
 *       var source = new source.SbisService({endpoint: 'Employee'});
 *       source.call('read', {login: 'root'}).addCallback(function(response) {
 *          var employee = new entity.Record({
 *             rawData: response.getRawData(),
 *             adapter: response.getAdapter()
 *          });
 *          console.log(employee.get('id'));
 *          console.log(employee.get('firstName'));
 *       });
 *    });
 * </pre>
 * @class Types/_entity/Record
 * @mixes Types/_entity/DestroyableMixin
 * @implements Types/_entity/IObject
 * @implements Types/_entity/IObjectNotify
 * @implements Types/_entity/ICloneable
 * @implements Types/_entity/IProducible
 * @implements Types/_entity/IEquatable
 * @implements Types/_collection/IEnumerable
 * @implements Types/_entity/relation/IReceiver
 * @implements Types/_entity/IVersionable
 * @mixes Types/_entity/OptionsMixin
 * @mixes Types/_entity/ObservableMixin
 * @mixes Types/_entity/SerializableMixin
 * @mixes Types/_entity/CloneableMixin
 * @mixes Types/_entity/ManyToManyMixin
 * @mixes Types/_entity/ReadWriteMixin
 * @mixes Types/_entity/FormattableMixin
 * @mixes Types/_entity/VersionableMixin
 * @ignoreOptions owner cloneChanged
 * @ignoreMethods detach
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/Record', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/DestroyableMixin',
    'Types/_entity/OptionsToPropertyMixin',
    'Types/_entity/ObservableMixin',
    'Types/_entity/SerializableMixin',
    'Types/_entity/CloneableMixin',
    'Types/_entity/ManyToManyMixin',
    'Types/_entity/ReadWriteMixin',
    'Types/_entity/FormattableMixin',
    'Types/_entity/VersionableMixin',
    'Types/_entity/factory',
    'Types/di',
    'Types/util',
    'Types/shim'
], function (require, exports, tslib_1, DestroyableMixin_1, OptionsToPropertyMixin_1, ObservableMixin_1, SerializableMixin_1, CloneableMixin_1, ManyToManyMixin_1, ReadWriteMixin_1, FormattableMixin_1, VersionableMixin_1, factory_1, di_1, util_1, shim_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Свойство, хранящее кэш полей
     */
    /**
     * Свойство, хранящее кэш полей
     */
    var $fieldsCache = util_1.protect('fieldsCache');    /**
     * Свойство, хранящее клоны полей
     */
    /**
     * Свойство, хранящее клоны полей
     */
    var $fieldsClone = util_1.protect('fieldsClone');    /**
     * Свойство, хранящее измененные полй
     */
    /**
     * Свойство, хранящее измененные полй
     */
    var $changedFields = util_1.protect('changedFields');    /**
     * Возможные состояния записи
     */
    /**
     * Возможные состояния записи
     */
    var STATES = {
        ADDED: 'Added',
        DELETED: 'Deleted',
        CHANGED: 'Changed',
        UNCHANGED: 'Unchanged',
        DETACHED: 'Detached'
    };    /**
     * Префикс названий отношений для полей
     */
    /**
     * Префикс названий отношений для полей
     */
    var FIELD_RELATION_PREFIX = 'field.';    /**
     * Режим кэширования: только объекты
     */
    /**
     * Режим кэширования: только объекты
     */
    var CACHE_MODE_OBJECTS = util_1.protect('objects');    /**
     * Режим кэширования: все значения
     */
    /**
     * Режим кэширования: все значения
     */
    var CACHE_MODE_ALL = util_1.protect('all');    /**
     * Возвращает признак примитивного значения (не объекта)
     */
    /**
     * Возвращает признак примитивного значения (не объекта)
     */
    function isPrimitive(value) {
        return value && typeof value === 'object' ? false : true;
    }    /**
     * Возвращает valueOf от объекта, либо value если это не объект
     */
    /**
     * Возвращает valueOf от объекта, либо value если это не объект
     */
    function getValueOf(value) {
        if (value && typeof value === 'object' && value !== value.valueOf()) {
            return value.valueOf();
        }
        return value;
    }    /**
     * Возвращает признак эквивалентности значений с учетом того, что каждоое из них может являться объектов, оборачивающим
     * примитивное значение
     */
    /**
     * Возвращает признак эквивалентности значений с учетом того, что каждоое из них может являться объектов, оборачивающим
     * примитивное значение
     */
    function isEqualValues(first, second) {
        return getValueOf(first) === getValueOf(second);
    }    /**
     * Возвращает тип значения
     */
    /**
     * Возвращает тип значения
     */
    function getValueType(value) {
        switch (typeof value) {
        case 'boolean':
            return 'boolean';
        case 'number':
            if (value % 1 === 0) {
                return 'integer';
            }
            return 'real';
        case 'object':
            if (value === null) {
                return 'string';
            } else if (value instanceof Record) {
                return 'record';
            } else if (value && value['[Types/_collection/RecordSet]']) {
                return 'recordset';
            } else if (value instanceof Date) {
                if (value.hasOwnProperty('_serializeMode')) {
                    switch (value.getSQLSerializationMode()) {
                    case Date.SQL_SERIALIZE_MODE_DATE:
                        return 'date';
                    case Date.SQL_SERIALIZE_MODE_TIME:
                        return 'time';
                    }
                }
                return 'datetime';
            } else if (value instanceof Array) {
                return {
                    type: 'array',
                    kind: getValueType(value.find(function (item) {
                        return item !== null && item !== undefined;
                    }))
                };
            }
            return 'object';
        default:
            return 'string';
        }
    }
    var Record = /** @class */
    function (_super) {
        tslib_1.__extends(Record, _super);
        function Record(options) {
            var _this = this;
            if (options && options.owner && !options.owner['[Types/_collection/RecordSet]']) {
                throw new TypeError('Records owner should be an instance of Types/collection:RecordSet');
            }
            _this = _super.call(this, options) || this;
            OptionsToPropertyMixin_1.default.call(_this, options);
            SerializableMixin_1.default.constructor.call(_this);
            FormattableMixin_1.default.constructor.call(_this, options);
            ReadWriteMixin_1.default.constructor.call(_this, options);
            _this._publish('onPropertyChange');
            _this._clearChangedFields();
            _this._acceptedState = _this._$state;
            return _this;
        }
        Object.defineProperty(Record.prototype, '_fieldsCache', {
            /**
             * @property Объект содержащий закэшированные значения полей
             */
            get: function () {
                return this[$fieldsCache] || (this[$fieldsCache] = new shim_1.Map());
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Record.prototype, '_fieldsClone', {
            /**
             * @property Объект содержащий клонированные значения полей
             */
            get: function () {
                return this[$fieldsClone] || (this[$fieldsClone] = new shim_1.Map());
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Record.prototype, '_changedFields', {
            /**
             * @property Данные об измененных полях
             */
            get: function () {
                var _this = this;
                var result = {};
                var changedFields = this[$changedFields];
                if (!changedFields) {
                    return result;
                }
                var data;
                var byLink;
                var value;
                Object.keys(changedFields).forEach(function (field) {
                    data = changedFields[field];
                    value = data[0];
                    byLink = data[1];    // Check record state if it's changed by link
                    // Check record state if it's changed by link
                    if (value && byLink && value['[Types/_entity/Record]'] && !value.isChanged()) {
                        return;
                    }
                    result[field] = _this._haveToClone(value) && _this._fieldsClone.has(field) ? _this._fieldsClone.get(field) : value;
                });
                return result;
            },
            enumerable: true,
            configurable: true
        });
        Record.prototype.destroy = function () {
            this[$changedFields] = null;
            this._clearFieldsCache();
            ReadWriteMixin_1.default.destroy.call(this);
            DestroyableMixin_1.default.prototype.destroy.call(this);
        };
        Record.prototype.get = function (name) {
            if (this._fieldsCache.has(name)) {
                return this._fieldsCache.get(name);
            }
            var value = this._getRawDataValue(name);
            if (this._isFieldValueCacheable(value)) {
                this._addChild(value, this._getRelationNameForField(name));
                this._fieldsCache.set(name, value);
                if (this._haveToClone(value)) {
                    this._fieldsClone.set(name, value.clone());
                }
            }
            return value;
        };
        Record.prototype.set = function (name, value) {
            var _this = this;
            var map = this._getHashMap(name, value);
            var errors = [];
            var changed = this._setPairs(Object.keys(map).map(function (key) {
                return [
                    key,
                    map[key],
                    _this.get(key)
                ];
            }), errors);
            if (changed) {
                this._notifyChange(changed);
            }
            this._checkErrors(errors);
        };
        Record.prototype.has = function (name) {
            return this._getRawDataFields().indexOf(name) > -1;
        };    /**
         * Устанавливает значения полей из пар "новое значение => старое значение"
         * @param {Array} pairs Массив элементов вида [имя поля, новое значение, старое значение]
         * @param {Array} errors Ошибки установки значений по полям
         * @return {Object|null} Изменившиеся значения
         * @protected
         */
        /**
         * Устанавливает значения полей из пар "новое значение => старое значение"
         * @param {Array} pairs Массив элементов вида [имя поля, новое значение, старое значение]
         * @param {Array} errors Ошибки установки значений по полям
         * @return {Object|null} Изменившиеся значения
         * @protected
         */
        Record.prototype._setPairs = function (pairs, errors) {
            var _this = this;
            var changed = null;
            pairs.forEach(function (item) {
                var key = item[0], newValue = item[1], oldValue = item[2];
                var value = newValue;    // Check if value changed
                // Check if value changed
                if (isEqualValues(value, oldValue)) {
                    // Update raw data by link if same Object has been set
                    if (typeof value === 'object') {
                        _this._setRawDataValue(key, value);
                    }
                } else {
                    // Try to set every field
                    try {
                        // Work with relations
                        _this._removeChild(oldValue);    // Save value to rawData
                        // Save value to rawData
                        if (isPrimitive(value)) {
                            value = _this._setRawDataValue(key, value);
                        } else {
                            _this._setRawDataValue(key, value);
                        }    // Work with relations
                        // Work with relations
                        _this._addChild(value, _this._getRelationNameForField(key));    // Compare once again because value can change the type during Factory converting
                        // Compare once again because value can change the type during Factory converting
                        if (value !== oldValue) {
                            if (!_this.has(key)) {
                                _this._addRawDataField(key);
                            }
                            if (!changed) {
                                changed = {};
                            }
                            changed[key] = value;    // Compare new value with initial value
                            // Compare new value with initial value
                            if (_this._hasChangedField(key) && getValueOf(_this._getChangedFieldValue(key)) === getValueOf(value)) {
                                // Revert changed if new value is equal initial value
                                _this._unsetChangedField(key);
                            } else {
                                // Set changed if new value is not equal initial value
                                _this._setChangedField(key, oldValue);
                            }    // Cache value if necessary
                            // Cache value if necessary
                            if (_this._isFieldValueCacheable(value)) {
                                _this._fieldsCache.set(key, value);
                                if (_this._haveToClone(value)) {
                                    _this._fieldsClone.set(key, value.clone());
                                }
                            } else {
                                _this._fieldsCache.delete(key);
                                _this._fieldsClone.delete(key);
                            }
                        }
                    } catch (err) {
                        // Collecting errors for every field
                        errors.push(err);
                    }
                }
            });
            return changed;
        };    /**
         * Возвращает энумератор для перебора названий полей записи
         * @return {Types/_collection/ArrayEnumerator}
         * @example
         * Переберем все поля записи:
         * <pre>
         *    var user = new Record({
         *          rawData: {
         *             id: 1,
         *             login: 'dummy',
         *             group_id: 7
         *          }
         *       }),
         *       enumerator = user.getEnumerator(),
         *       fields = [];
         *
         *    while (enumerator.moveNext()) {
         *       fields.push(enumerator.getCurrent());
         *    }
         *    fields.join(', ');//'id, login, group_id'
         * </pre>
         */
        /**
         * Возвращает энумератор для перебора названий полей записи
         * @return {Types/_collection/ArrayEnumerator}
         * @example
         * Переберем все поля записи:
         * <pre>
         *    var user = new Record({
         *          rawData: {
         *             id: 1,
         *             login: 'dummy',
         *             group_id: 7
         *          }
         *       }),
         *       enumerator = user.getEnumerator(),
         *       fields = [];
         *
         *    while (enumerator.moveNext()) {
         *       fields.push(enumerator.getCurrent());
         *    }
         *    fields.join(', ');//'id, login, group_id'
         * </pre>
         */
        Record.prototype.getEnumerator = function () {
            return di_1.create('Types/collection:enumerator.Arraywise', this._getRawDataFields());
        };    /**
         * Перебирает все поля записи
         * @param {Function(String, *)} callback Ф-я обратного вызова для каждого поля. Первым аргументом придет название
         * поля, вторым - его значение.
         * @param {Object} [context] Контекст вызова callback.
         * @example
         * Переберем все поля записи:
         * <pre>
         *    var user = new Record({
         *          rawData: {
         *             id: 1,
         *             login: 'dummy',
         *             group_id: 7
         *          }
         *       }),
         *       fields = [];
         *
         *    user.each(function(field) {
         *       fields.push(field);
         *    });
         *    fields.join(', ');//'id, login, group_id'
         * </pre>
         */
        /**
         * Перебирает все поля записи
         * @param {Function(String, *)} callback Ф-я обратного вызова для каждого поля. Первым аргументом придет название
         * поля, вторым - его значение.
         * @param {Object} [context] Контекст вызова callback.
         * @example
         * Переберем все поля записи:
         * <pre>
         *    var user = new Record({
         *          rawData: {
         *             id: 1,
         *             login: 'dummy',
         *             group_id: 7
         *          }
         *       }),
         *       fields = [];
         *
         *    user.each(function(field) {
         *       fields.push(field);
         *    });
         *    fields.join(', ');//'id, login, group_id'
         * </pre>
         */
        Record.prototype.each = function (callback, context) {
            var enumerator = this.getEnumerator();
            var name;
            while (enumerator.moveNext()) {
                name = enumerator.getCurrent();
                callback.call(context || this, name, this.get(name));
            }
        };
        Record.prototype.isEqual = function (to) {
            if (to === this) {
                return true;
            }
            if (!to) {
                return false;
            }
            if (!(to instanceof Record)) {
                return false;
            }
            return JSON.stringify(this._getRawData()) === JSON.stringify(to.getRawData(true));
        };
        Record.prototype.relationChanged = function (which, route) {
            var _this = this;
            var checkRawData = function (fieldName, target) {
                var map = {};
                var adapter = _this._getRawDataAdapter();
                var hasInRawData = adapter.has(fieldName);    // Apply child's raw data to the self raw data if necessary
                // Apply child's raw data to the self raw data if necessary
                if (hasInRawData) {
                    _this._setRawDataValue(fieldName, target, true);
                }
                _this._setChangedField(fieldName, target, true);
                map[fieldName] = target;
                _this._notify('onPropertyChange', map);
                return map;
            };
            var name = route[0];
            var fieldName = this._getFieldFromRelationName(name);
            var target = which.target;
            switch (which.original) {
            case Record.prototype.acceptChanges:
                if (fieldName && (target['[Types/_entity/Record]'] && !target.isChanged() || target['[Types/_collection/RecordSet]'] && !target.isChanged())) {
                    this.acceptChanges([fieldName]);
                }
                break;
            case Record.prototype.rejectChanges:
                if (fieldName && (target['[Types/_entity/Record]'] && !target.isChanged() || target['[Types/_collection/RecordSet]'] && !target.isChanged())) {
                    this.rejectChanges([fieldName]);
                }
                break;
            case Record.prototype.addField:
            case Record.prototype.removeField:
            case Record.prototype.removeFieldAt:
                this._resetRawDataAdapter();
                this._resetRawDataFields();
                if (fieldName) {
                    checkRawData(fieldName, target);
                }
                break;
            default:
                if (fieldName) {
                    var map = checkRawData(fieldName, target);    // Set which data to field name => value
                    // Set which data to field name => value
                    return {
                        target: target,
                        data: map
                    };
                }
            }
        };
        Record.prototype._getRelationNameForField = function (name) {
            return FIELD_RELATION_PREFIX + name;
        };
        Record.prototype._getFieldFromRelationName = function (name) {
            name += '';
            if (name.substr(0, FIELD_RELATION_PREFIX.length) === FIELD_RELATION_PREFIX) {
                return name.substr(FIELD_RELATION_PREFIX.length);
            }
        };
        Record.produceInstance = function (data, options) {
            var instanceOptions = { rawData: data };
            if (options && options.adapter) {
                instanceOptions.adapter = options.adapter;
            }
            return new this(instanceOptions);
        };    // endregion
              // region SerializableMixin
        // endregion
        // region SerializableMixin
        Record.prototype._getSerializableState = function (state) {
            var resultState = SerializableMixin_1.default.prototype._getSerializableState.call(this, state);
            resultState = FormattableMixin_1.default._getSerializableState.call(this, resultState);
            resultState._changedFields = this[$changedFields];    // Keep format if record has owner with format
            // Keep format if record has owner with format
            if (resultState.$options.owner && resultState.$options.owner._hasFormat()) {
                resultState._format = resultState.$options.owner.getFormat();
            }
            delete resultState.$options.owner;
            return resultState;
        };
        Record.prototype._setSerializableState = function (state) {
            var fromSerializableMixin = SerializableMixin_1.default.prototype._setSerializableState(state);
            var fromFormattableMixin = FormattableMixin_1.default._setSerializableState(state);
            return function () {
                fromSerializableMixin.call(this);
                fromFormattableMixin.call(this);
                this[$changedFields] = state._changedFields;
                if (state._format) {
                    this._$format = state._format;
                }
            };
        };    // endregion
              // region FormattableMixin
        // endregion
        // region FormattableMixin
        Record.prototype.setRawData = function (rawData) {
            FormattableMixin_1.default.setRawData.call(this, rawData);
            this._nextVersion();
            this._clearFieldsCache();
            this._notifyChange();
        };
        Record.prototype.addField = function (format, at, value) {
            this._checkFormatIsWritable();
            format = this._buildField(format);
            FormattableMixin_1.default.addField.call(this, format, at);
            if (value !== undefined) {
                this.set(format.getName(), value);
            }
            this._childChanged(Record.prototype.addField);
            this._nextVersion();
        };
        Record.prototype.removeField = function (name) {
            this._checkFormatIsWritable();
            this._nextVersion();
            this._fieldsCache.delete(name);
            this._fieldsClone.delete(name);
            FormattableMixin_1.default.removeField.call(this, name);
            this._childChanged(Record.prototype.removeField);
        };
        Record.prototype.removeFieldAt = function (at) {
            this._checkFormatIsWritable();
            this._nextVersion();
            var field = this._getFormat(true).at(at);
            if (field) {
                this._fieldsCache.delete(field.getName());
                this._fieldsClone.delete(field.getName());
            }
            FormattableMixin_1.default.removeFieldAt.call(this, at);
            this._childChanged(Record.prototype.removeFieldAt);
        };
        Record.prototype._hasFormat = function () {
            var owner = this.getOwner();
            if (owner) {
                return owner._hasFormat();
            } else {
                return FormattableMixin_1.default._hasFormat.call(this);
            }
        };
        Record.prototype._getFormat = function (build) {
            var owner = this.getOwner();
            if (owner) {
                return owner._getFormat(build);
            } else {
                return FormattableMixin_1.default._getFormat.call(this, build);
            }
        };
        Record.prototype._getFieldFormat = function (name, adapter) {
            var owner = this.getOwner();
            if (owner) {
                return owner._getFieldFormat(name, adapter);
            } else {
                return FormattableMixin_1.default._getFieldFormat.call(this, name, adapter);
            }
        };    /**
         * Создает адаптер для сырых данных
         * @return {Types/_entity/adapter/IRecord}
         * @protected
         */
        /**
         * Создает адаптер для сырых данных
         * @return {Types/_entity/adapter/IRecord}
         * @protected
         */
        Record.prototype._createRawDataAdapter = function () {
            return this._getAdapter().forRecord(this._getRawData(true));
        };    /**
         * Проверяет, что формат записи доступен для записи
         * @protected
         */
        /**
         * Проверяет, что формат записи доступен для записи
         * @protected
         */
        Record.prototype._checkFormatIsWritable = function () {
            var owner = this.getOwner();
            if (owner) {
                throw new Error('Record format has read only access if record belongs to recordset. ' + 'You should change recordset format instead.');
            }
        };    // endregion
              // region Public methods
              /**
         * Возвращает признак, что поле с указанным именем было изменено.
         * Если name не передано, то проверяет, что изменено хотя бы одно поле.
         * @param {String} [name] Имя поля
         * @return {Boolean}
         * @example
         * Проверим изменилось ли поле title:
         * <pre>
         *    var article = new Record({
         *       rawData: {
         *          id: 1,
         *          title: 'Initial Title'
         *       }
         *    });
         *    article.isChanged('title');//false
         *    article.set('title', 'New Title');
         *    article.isChanged('title');//true
         * </pre>
         * Проверим изменилось ли какое-нибудь поле:
         * <pre>
         *    var article = new Record({
         *       rawData: {
         *          id: 1,
         *          title: 'Initial Title'
         *       }
         *    });
         *    article.isChanged();//false
         *    article.set('title', 'New Title');
         *    article.isChanged();//true
         * </pre>
         */
        // endregion
        // region Public methods
        /**
         * Возвращает признак, что поле с указанным именем было изменено.
         * Если name не передано, то проверяет, что изменено хотя бы одно поле.
         * @param {String} [name] Имя поля
         * @return {Boolean}
         * @example
         * Проверим изменилось ли поле title:
         * <pre>
         *    var article = new Record({
         *       rawData: {
         *          id: 1,
         *          title: 'Initial Title'
         *       }
         *    });
         *    article.isChanged('title');//false
         *    article.set('title', 'New Title');
         *    article.isChanged('title');//true
         * </pre>
         * Проверим изменилось ли какое-нибудь поле:
         * <pre>
         *    var article = new Record({
         *       rawData: {
         *          id: 1,
         *          title: 'Initial Title'
         *       }
         *    });
         *    article.isChanged();//false
         *    article.set('title', 'New Title');
         *    article.isChanged();//true
         * </pre>
         */
        Record.prototype.isChanged = function (name) {
            return name ? this._hasChangedField(name) : this.getChanged().length > 0;
        };    /**
         * Возвращает рекордсет, которому принадлежит запись. Может не принадлежать рекордсету.
         * @return {Types/_collection/RecordSet|null}
         * @example
         * Проверим владельца записи до и после вставки в рекордсет:
         * <pre>
         *    var record = new Record(),
         *       rs1 = new RecordSet(),
         *       rs2 = new RecordSet();
         *
         *    record.getOwner();//null
         *
         *    rs1.add(record);
         *    record.getOwner() === null;//true
         *    rs1.at(0) === record;//false
         *    rs1.at(0).getOwner() === rs1;//true
         *
         *    rs2.add(record);
         *    record.getOwner() === null;//true
         *    rs2.at(0).getOwner() === rs2;//true
         * </pre>
         */
        /**
         * Возвращает рекордсет, которому принадлежит запись. Может не принадлежать рекордсету.
         * @return {Types/_collection/RecordSet|null}
         * @example
         * Проверим владельца записи до и после вставки в рекордсет:
         * <pre>
         *    var record = new Record(),
         *       rs1 = new RecordSet(),
         *       rs2 = new RecordSet();
         *
         *    record.getOwner();//null
         *
         *    rs1.add(record);
         *    record.getOwner() === null;//true
         *    rs1.at(0) === record;//false
         *    rs1.at(0).getOwner() === rs1;//true
         *
         *    rs2.add(record);
         *    record.getOwner() === null;//true
         *    rs2.at(0).getOwner() === rs2;//true
         * </pre>
         */
        Record.prototype.getOwner = function () {
            return this._$owner;
        };    /**
         * Отвязывает запись от рекордсета: сбрасывает ссылку на владельца и устанавливает состояние detached.
         */
        /**
         * Отвязывает запись от рекордсета: сбрасывает ссылку на владельца и устанавливает состояние detached.
         */
        Record.prototype.detach = function () {
            this._$owner = null;
            this.setState(STATES.DETACHED);
        };    /**
         * Возвращает текущее состояние записи.
         * @return {RecordState}
         * @see state
         * @see setState
         * @example
         * Проверим состояние записи до и после вставки в рекордсет, а также после удаления из рекордсета:
         * <pre>
         *    var record = new Record(),
         *       RecordState = Record.RecordState,
         *       rs = new RecordSet();
         *
         *    record.getState() === RecordState.DETACHED;//true
         *
         *    rs.add(record);
         *    record.getState() === RecordState.ADDED;//true
         *
         *    rs.remove(record);
         *    record.getState() === RecordState.DETACHED;//true
         * </pre>
         */
        /**
         * Возвращает текущее состояние записи.
         * @return {RecordState}
         * @see state
         * @see setState
         * @example
         * Проверим состояние записи до и после вставки в рекордсет, а также после удаления из рекордсета:
         * <pre>
         *    var record = new Record(),
         *       RecordState = Record.RecordState,
         *       rs = new RecordSet();
         *
         *    record.getState() === RecordState.DETACHED;//true
         *
         *    rs.add(record);
         *    record.getState() === RecordState.ADDED;//true
         *
         *    rs.remove(record);
         *    record.getState() === RecordState.DETACHED;//true
         * </pre>
         */
        Record.prototype.getState = function () {
            return this._$state;
        };    /**
         * Устанавливает текущее состояние записи.
         * @param {RecordState} state Новое состояние записи.
         * @see state
         * @see getState
         * @example
         * Пометитм запись, как удаленную:
         * <pre>
         *    var record = new Record();
         *    record.setState(Record.RecordState.DELETED);
         * </pre>
         */
        /**
         * Устанавливает текущее состояние записи.
         * @param {RecordState} state Новое состояние записи.
         * @see state
         * @see getState
         * @example
         * Пометитм запись, как удаленную:
         * <pre>
         *    var record = new Record();
         *    record.setState(Record.RecordState.DELETED);
         * </pre>
         */
        Record.prototype.setState = function (state) {
            this._$state = state;
        };    /**
         * Возвращает массив названий измененных полей.
         * @return {Array}
         * @example
         * Получим список изменненых полей статьи:
         * <pre>
         *    var article = new Record({
         *       rawData: {
         *          id: 1,
         *          date: new Date(2012, 12, 12),
         *          title: 'Initial Title'
         *       }
         *    });
         *
         *    article.getChanged();//[]
         *
         *    article.set({
         *       date: new Date(),
         *       title: 'New Title'
         *    });
         *    article.getChanged();//['date', 'title']
         * </pre>
         */
        /**
         * Возвращает массив названий измененных полей.
         * @return {Array}
         * @example
         * Получим список изменненых полей статьи:
         * <pre>
         *    var article = new Record({
         *       rawData: {
         *          id: 1,
         *          date: new Date(2012, 12, 12),
         *          title: 'Initial Title'
         *       }
         *    });
         *
         *    article.getChanged();//[]
         *
         *    article.set({
         *       date: new Date(),
         *       title: 'New Title'
         *    });
         *    article.getChanged();//['date', 'title']
         * </pre>
         */
        Record.prototype.getChanged = function () {
            return Object.keys(this._changedFields);
        };    /**
         * Подтверждает изменения состояния записи с момента предыдущего вызова acceptChanges():
         * <ul>
         *    <li>Сбрасывает признак изменения для всех измененных полей;
         *    <li>Меняет {@link state} следующим образом:
         *       <ul>
         *          <li>Added или Changed становится Unchanged;</li>
         *          <li>Deleted становится Detached;</li>
         *          <li>остальные не меняются.</li>
         *       </ul>
         *    </li>
         * </ul>
         * Если передан аргумент fields, то подтверждаются изменения только указанного набора полей. {@link state State} в
         * этом случае меняется только если fields включает в себя весь набор измененных полей.
         * @param {Array.<String>} [fields] Поля, в которых подтвердить изменения.
         * @param {Boolean} [spread=false] Распространять изменения по иерархии родителей. При включениии будут вызваны
         * acceptChanges всех владельцев.
         * @example
         * Подтвердим изменения в записи:
         * <pre>
         *    var article = new Record({
         *       rawData: {
         *          id: 1,
         *          title: 'Initial Title'
         *       }
         *    });
         *
         *    article.set('title', 'New Title');
         *    article.getChanged();//['title']
         *    article.setState(Record.RecordState.DELETED);
         *
         *    article.acceptChanges();
         *    article.getChanged();//[]
         *    article.getState() === RecordState.DETACHED;//true
         * </pre>
         * Подтвердим изменение поля password:
         * <pre>
         *    var account = new Record({
         *       rawData: {
         *          id: 1,
         *          login: 'root'
         *          password: '123'
         *       }
         *    });
         *
         *    article.set({
         *       login: 'admin',
         *       password: '321'
         *    });
         *
         *    article.acceptChanges(['password']);
         *    article.getChanged();//['login']
         *    article.getState() === RecordState.CHANGED;//true
         * </pre>
         */
        /**
         * Подтверждает изменения состояния записи с момента предыдущего вызова acceptChanges():
         * <ul>
         *    <li>Сбрасывает признак изменения для всех измененных полей;
         *    <li>Меняет {@link state} следующим образом:
         *       <ul>
         *          <li>Added или Changed становится Unchanged;</li>
         *          <li>Deleted становится Detached;</li>
         *          <li>остальные не меняются.</li>
         *       </ul>
         *    </li>
         * </ul>
         * Если передан аргумент fields, то подтверждаются изменения только указанного набора полей. {@link state State} в
         * этом случае меняется только если fields включает в себя весь набор измененных полей.
         * @param {Array.<String>} [fields] Поля, в которых подтвердить изменения.
         * @param {Boolean} [spread=false] Распространять изменения по иерархии родителей. При включениии будут вызваны
         * acceptChanges всех владельцев.
         * @example
         * Подтвердим изменения в записи:
         * <pre>
         *    var article = new Record({
         *       rawData: {
         *          id: 1,
         *          title: 'Initial Title'
         *       }
         *    });
         *
         *    article.set('title', 'New Title');
         *    article.getChanged();//['title']
         *    article.setState(Record.RecordState.DELETED);
         *
         *    article.acceptChanges();
         *    article.getChanged();//[]
         *    article.getState() === RecordState.DETACHED;//true
         * </pre>
         * Подтвердим изменение поля password:
         * <pre>
         *    var account = new Record({
         *       rawData: {
         *          id: 1,
         *          login: 'root'
         *          password: '123'
         *       }
         *    });
         *
         *    article.set({
         *       login: 'admin',
         *       password: '321'
         *    });
         *
         *    article.acceptChanges(['password']);
         *    article.getChanged();//['login']
         *    article.getState() === RecordState.CHANGED;//true
         * </pre>
         */
        Record.prototype.acceptChanges = function (fields, spread) {
            var _this = this;
            if (spread === undefined && typeof fields === 'boolean') {
                spread = fields;
                fields = undefined;
            }
            if (fields === undefined) {
                this._clearChangedFields();
            } else {
                if (!(fields instanceof Array)) {
                    throw new TypeError('Argument "fields" should be an instance of Array');
                }
                fields.forEach(function (field) {
                    _this._unsetChangedField(field);
                });
            }
            if (this.getChanged().length === 0) {
                switch (this._$state) {
                case STATES.ADDED:
                case STATES.CHANGED:
                    this._$state = STATES.UNCHANGED;
                    break;
                case STATES.DELETED:
                    this._$state = STATES.DETACHED;
                    break;
                }
            }
            this._acceptedState = this._$state;
            if (spread) {
                this._childChanged(Record.prototype.acceptChanges);
            }
        };    /**
         * Возвращает запись к состоянию, в котором она была с момента последнего вызова acceptChanges:
         * <ul>
         *    <li>Отменяются изменения всех полей;
         *    <li>{@link state State} возвращается к состоянию, в котором он был сразу после вызова acceptChanges.</li>
         * </ul>
         * Если передан аргумент fields, то откатываются изменения только указанного набора полей. {@link state State} в
         * этом случае меняется только если fields включает в себя весь набор измененных полей.
         * @param {Array.<String>} [fields] Поля, в которых подтвердить изменения.
         * @param {Boolean} [spread=false] Распространять изменения по иерархии родителей. При включениии будут вызваны
         * acceptChanges всех владельцев.
         * @example
         * Отменим изменения в записи:
         * <pre>
         *    var article = new Record({
         *       rawData: {
         *          id: 1,
         *          title: 'Initial Title'
         *       }
         *    });
         *
         *    article.set('title', 'New Title');
         *    article.getChanged();//['title']
         *    article.setState(Record.RecordState.DELETED);
         *
         *    article.rejectChanges();
         *    article.getChanged();//[]
         *    article.getState() === RecordState.DETACHED;//true
         *    article.get('title');//'Initial Title'
         * </pre>
         * Отменим изменение поля password:
         * <pre>
         *    var account = new Record({
         *       rawData: {
         *          id: 1,
         *          login: 'root'
         *          password: '123'
         *       }
         *    });
         *
         *    article.set({
         *       login: 'admin',
         *       password: '321'
         *    });
         *
         *    article.rejectChanges(['password']);
         *    article.getChanged();//['login']
         *    article.get('login');//'admin'
         *    article.get('password');//'123'
         * </pre>
         */
        /**
         * Возвращает запись к состоянию, в котором она была с момента последнего вызова acceptChanges:
         * <ul>
         *    <li>Отменяются изменения всех полей;
         *    <li>{@link state State} возвращается к состоянию, в котором он был сразу после вызова acceptChanges.</li>
         * </ul>
         * Если передан аргумент fields, то откатываются изменения только указанного набора полей. {@link state State} в
         * этом случае меняется только если fields включает в себя весь набор измененных полей.
         * @param {Array.<String>} [fields] Поля, в которых подтвердить изменения.
         * @param {Boolean} [spread=false] Распространять изменения по иерархии родителей. При включениии будут вызваны
         * acceptChanges всех владельцев.
         * @example
         * Отменим изменения в записи:
         * <pre>
         *    var article = new Record({
         *       rawData: {
         *          id: 1,
         *          title: 'Initial Title'
         *       }
         *    });
         *
         *    article.set('title', 'New Title');
         *    article.getChanged();//['title']
         *    article.setState(Record.RecordState.DELETED);
         *
         *    article.rejectChanges();
         *    article.getChanged();//[]
         *    article.getState() === RecordState.DETACHED;//true
         *    article.get('title');//'Initial Title'
         * </pre>
         * Отменим изменение поля password:
         * <pre>
         *    var account = new Record({
         *       rawData: {
         *          id: 1,
         *          login: 'root'
         *          password: '123'
         *       }
         *    });
         *
         *    article.set({
         *       login: 'admin',
         *       password: '321'
         *    });
         *
         *    article.rejectChanges(['password']);
         *    article.getChanged();//['login']
         *    article.get('login');//'admin'
         *    article.get('password');//'123'
         * </pre>
         */
        Record.prototype.rejectChanges = function (fields, spread) {
            var _this = this;
            if (spread === undefined && typeof fields === 'boolean') {
                spread = fields;
                fields = undefined;
            }
            var toSet = {};
            if (fields === undefined) {
                fields = this.getChanged();
            } else if (!(fields instanceof Array)) {
                throw new TypeError('Argument "fields" should be an instance of Array');
            }
            fields.forEach(function (name) {
                if (_this._hasChangedField(name)) {
                    toSet[name] = _this._getChangedFieldValue(name);
                }
            });
            this.set(toSet);
            for (var name in toSet) {
                if (toSet.hasOwnProperty(name)) {
                    this._unsetChangedField(name);
                }
            }
            if (this.getChanged().length === 0) {
                this._$state = this._acceptedState;
            }
            if (spread) {
                this._childChanged(Record.prototype.rejectChanges);
            }
        };    /**
         * Возвращает значения всех свойств в виде строки формата json
         * @return {String}
         * @example
         * Получим значения всех свойств в виде строки:
         * <pre>
         *    var article = new Model({
         *       rawData: {id: 1, title: 'Article 1'}
         *    });
         *    article.toString();//'{"id": 1, "title": "Article 1"}'
         * </pre>
         */
        /**
         * Возвращает значения всех свойств в виде строки формата json
         * @return {String}
         * @example
         * Получим значения всех свойств в виде строки:
         * <pre>
         *    var article = new Model({
         *       rawData: {id: 1, title: 'Article 1'}
         *    });
         *    article.toString();//'{"id": 1, "title": "Article 1"}'
         * </pre>
         */
        Record.prototype.toString = function () {
            var result = {};
            this.each(function (key, value) {
                result[key] = value;
            });
            return JSON.stringify(result);
        };    // endregion
              // region Proteted methods
              /**
         * Проверяет наличие ошибок
         * @param {Array.<Error>} errors Массив ошибок
         * @protected
         */
        // endregion
        // region Proteted methods
        /**
         * Проверяет наличие ошибок
         * @param {Array.<Error>} errors Массив ошибок
         * @protected
         */
        Record.prototype._checkErrors = function (errors) {
            if (errors.length) {
                // Looking for simple Error (use compare by >) that has priority to show.
                var error = errors[0];
                for (var i = errors.length; i > 0; i--) {
                    if (error > errors[i]) {
                        error = errors[i];
                    }
                }
                throw error;
            }
        };    /**
         * Возвращает hash map
         * @param {String|Object} name Название поля или набор полей
         * @param {String} [value] Значение поля
         * @return {Object}
         * @protected
         */
        /**
         * Возвращает hash map
         * @param {String|Object} name Название поля или набор полей
         * @param {String} [value] Значение поля
         * @return {Object}
         * @protected
         */
        Record.prototype._getHashMap = function (name, value) {
            var map = name;
            if (!(map instanceof Object)) {
                map = {};
                map[name] = value;
            }
            return map;
        };    /**
         * Обнуляет кэш значений полей
         * @protected
         */
        /**
         * Обнуляет кэш значений полей
         * @protected
         */
        Record.prototype._clearFieldsCache = function () {
            this[$fieldsCache] = null;
            this[$fieldsClone] = null;
        };    /**
         * Возвращает признак, что значение поля кэшируемое
         * @return {Boolean}
         * @protected
         */
        /**
         * Возвращает признак, что значение поля кэшируемое
         * @return {Boolean}
         * @protected
         */
        Record.prototype._isFieldValueCacheable = function (value) {
            switch (this._$cacheMode) {
            case CACHE_MODE_OBJECTS:
                return value instanceof Object;
            case CACHE_MODE_ALL:
                return true;
            }
            return false;
        };    /**
         * Возвращает режим работы с клонами значений, поддреживающих клонирование
         * @param {*} value Значение поля
         * @return {Boolean}
         */
        /**
         * Возвращает режим работы с клонами значений, поддреживающих клонирование
         * @param {*} value Значение поля
         * @return {Boolean}
         */
        Record.prototype._haveToClone = function (value) {
            return this._$cloneChanged && value && value['[Types/_entity/ICloneable]'];
        };    /**
         * Возвращает значение поля из "сырых" данных, прогнанное через фабрику
         * @param {String} name Название поля
         * @return {*}
         * @protected
         */
        /**
         * Возвращает значение поля из "сырых" данных, прогнанное через фабрику
         * @param {String} name Название поля
         * @return {*}
         * @protected
         */
        Record.prototype._getRawDataValue = function (name) {
            var adapter = this._getRawDataAdapter();
            if (!adapter.has(name)) {
                return;
            }
            var value = adapter.get(name);
            var format = this._getFieldFormat(name, adapter);
            return factory_1.default.cast(value, this._getFieldType(format), {
                format: format,
                adapter: this._getAdapter()
            });
        };    /**
         * Конвертирует значение поля через фабрику и сохраняет его в "сырых" данных
         * @param {String} name Название поля
         * @param {*} value Значение поля
         * @param {Boolean} [compatible=false] Значение поля совместимо по типу
         * @return {*} Значение поля, сконвертированное фабрикой
         * @protected
         */
        /**
         * Конвертирует значение поля через фабрику и сохраняет его в "сырых" данных
         * @param {String} name Название поля
         * @param {*} value Значение поля
         * @param {Boolean} [compatible=false] Значение поля совместимо по типу
         * @return {*} Значение поля, сконвертированное фабрикой
         * @protected
         */
        Record.prototype._setRawDataValue = function (name, value, compatible) {
            if (!compatible && value && value['[Types/_entity/FormattableMixin]']) {
                this._checkAdapterCompatibility(value.getAdapter());
            }
            var adapter = this._getRawDataAdapter();
            value = factory_1.default.serialize(value, {
                format: this._getFieldFormat(name, adapter),
                adapter: this.getAdapter()
            });
            adapter.set(name, value);
            return value;
        };    /**
         * Уведомляет об изменении полей записи
         * @param {Object} [map] Измененные поля
         * @protected
         */
        /**
         * Уведомляет об изменении полей записи
         * @param {Object} [map] Измененные поля
         * @protected
         */
        Record.prototype._notifyChange = function (map) {
            map = map || {};
            this._childChanged(map);
            this._nextVersion();
            this._notify('onPropertyChange', map);
        };    /**
         * Очищает информацию об измененных полях
         * @protected
         */
        /**
         * Очищает информацию об измененных полях
         * @protected
         */
        Record.prototype._clearChangedFields = function () {
            this[$changedFields] = {};
        };    /**
         * Возвращает признак наличия изменений в поле
         * @param {String} name Название поля
         * @return {Boolean}
         * @protected
         */
        /**
         * Возвращает признак наличия изменений в поле
         * @param {String} name Название поля
         * @return {Boolean}
         * @protected
         */
        Record.prototype._hasChangedField = function (name) {
            return this._changedFields.hasOwnProperty(name);
        };    /**
         * Возвращает оригинальное значение измененного поля
         * @param {String} name Название поля
         * @return {*}
         * @protected
         */
        /**
         * Возвращает оригинальное значение измененного поля
         * @param {String} name Название поля
         * @return {*}
         * @protected
         */
        Record.prototype._getChangedFieldValue = function (name) {
            return this._changedFields[name];
        };    /**
         * Устанавливает признак изменения поля
         * @param {String} name Название поля
         * @param {*} value Старое значение поля
         * @param {Boolean} byLink Значение изменилось по ссылке
         * @protected
         */
        /**
         * Устанавливает признак изменения поля
         * @param {String} name Название поля
         * @param {*} value Старое значение поля
         * @param {Boolean} byLink Значение изменилось по ссылке
         * @protected
         */
        Record.prototype._setChangedField = function (name, value, byLink) {
            if (!this[$changedFields].hasOwnProperty(name)) {
                this[$changedFields][name] = [
                    value,
                    Boolean(byLink)
                ];
            }
            switch (this._$state) {
            case STATES.UNCHANGED:
                this._$state = STATES.CHANGED;
                break;
            }
        };    /**
         * Снимает признак изменения поля
         * @param {String} name Название поля
         * @protected
         */
        /**
         * Снимает признак изменения поля
         * @param {String} name Название поля
         * @protected
         */
        Record.prototype._unsetChangedField = function (name) {
            delete this[$changedFields][name];
        };    // endregion
              // region Deprecated
              /**
         * @deprecated
         */
        // endregion
        // region Deprecated
        /**
         * @deprecated
         */
        Record.extend = function (mixinsList, classExtender) {
            util_1.logger.info('Types/_entity/Record', 'Method extend is deprecated, use ES6 extends or Core/core-extend');
            if (!require.defined('Core/core-extend')) {
                throw new ReferenceError('You should require module "Core/core-extend" to use old-fashioned "Types/_entity/Record::extend()" method.');
            }
            var coreExtend = require('Core/core-extend');
            return coreExtend(this, mixinsList, classExtender);
        };
        Object.defineProperty(Record, 'RecordState', {
            // endregion
            // region Statics
            get: function () {
                return STATES;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Record, 'CACHE_MODE_OBJECTS', {
            get: function () {
                return CACHE_MODE_OBJECTS;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Record, 'CACHE_MODE_ALL', {
            get: function () {
                return CACHE_MODE_ALL;
            },
            enumerable: true,
            configurable: true
        });    /**
         * @name Types/_entity/Record#addFieldTo
         * @function
         * Добавляет поле в запись. Если формат не указан, то он строится по типу значения поля.
         * @param {Types/_entity/Record} record Запись
         * @param {String} name Имя поля
         * @param {*} value Значение поля
         * @param {Object} [format] Формат поля
         * @static
         */
        /**
         * @name Types/_entity/Record#addFieldTo
         * @function
         * Добавляет поле в запись. Если формат не указан, то он строится по типу значения поля.
         * @param {Types/_entity/Record} record Запись
         * @param {String} name Имя поля
         * @param {*} value Значение поля
         * @param {Object} [format] Формат поля
         * @static
         */
        Record.addFieldTo = function (record, name, value, format) {
            if (!format) {
                var detectedFormat = getValueType(value);
                if (typeof detectedFormat === 'string') {
                    detectedFormat = {
                        name: '',
                        type: detectedFormat
                    };
                }
                detectedFormat.name = name;
                format = detectedFormat;
            }
            record.addField(format, undefined, value);
        };    /**
         * @name Types/_entity/Record#fromObject
         * @function
         * Создает запись по объекту c учетом типов значений полей. Поля добавляются в запись в алфавитном порядке.
         * @example
         * <pre>
         * var record = Record.fromObject({
         *       id: 1,
         *       title: 'title'
         *    }, 'Types/entity:adapter.Json'),
         *    format = record.getFormat();
         * format.each(function(field) {
         *    console.log(field.getName() + ': ' + field.getType());
         * });
         * //output: 'id: Integer', 'title: String'
         * </pre>
         * @param {Object} data Объект вида "имя поля" -> "значение поля"
         * @param {String|Types/_entity/adapter/IAdapter} [adapter='Types/entity:adapter.Json'] Адаптер для сырых данных
         * @return {Types/_entity/Record}
         * @static
         */
        /**
         * @name Types/_entity/Record#fromObject
         * @function
         * Создает запись по объекту c учетом типов значений полей. Поля добавляются в запись в алфавитном порядке.
         * @example
         * <pre>
         * var record = Record.fromObject({
         *       id: 1,
         *       title: 'title'
         *    }, 'Types/entity:adapter.Json'),
         *    format = record.getFormat();
         * format.each(function(field) {
         *    console.log(field.getName() + ': ' + field.getType());
         * });
         * //output: 'id: Integer', 'title: String'
         * </pre>
         * @param {Object} data Объект вида "имя поля" -> "значение поля"
         * @param {String|Types/_entity/adapter/IAdapter} [adapter='Types/entity:adapter.Json'] Адаптер для сырых данных
         * @return {Types/_entity/Record}
         * @static
         */
        Record.fromObject = function (data, adapter) {
            if (data === null) {
                return data;
            }
            if (data && data instanceof Record) {
                return data;
            }
            var record = new Record({
                adapter: adapter || 'Types/entity:adapter.Json',
                format: []
            });
            var sortNames = [];
            for (var name in data) {
                if (data.hasOwnProperty(name)) {
                    sortNames.push(name);
                }
            }
            sortNames = sortNames.sort();
            for (var i = 0, len = sortNames.length; i < len; i++) {
                var name = sortNames[i];
                var value = data[name];
                if (value === undefined) {
                    continue;
                }
                Record.addFieldTo(record, name, value);
            }
            return record;
        };    /**
         * @name Types/_entity/Record#filter
         * @function
         * Создает запись c набором полей, ограниченным фильтром.
         * @param {Types/_entity/Record} record Исходная запись
         * @param {Function(String, *): Boolean} callback Функция фильтрации полей, аргументами приходят имя поля и его
         * значение. Должна вернуть boolean - прошло ли поле фильтр.
         * @return {Types/_entity/Record}
         * @static
         */
        /**
         * @name Types/_entity/Record#filter
         * @function
         * Создает запись c набором полей, ограниченным фильтром.
         * @param {Types/_entity/Record} record Исходная запись
         * @param {Function(String, *): Boolean} callback Функция фильтрации полей, аргументами приходят имя поля и его
         * значение. Должна вернуть boolean - прошло ли поле фильтр.
         * @return {Types/_entity/Record}
         * @static
         */
        Record.filter = function (record, callback) {
            var result = new Record({ adapter: record.getAdapter() });
            var format = record.getFormat();
            format.each(function (field) {
                var name = field.getName();
                var value = record.get(name);
                if (!callback || callback(name, value)) {
                    result.addField(field);
                    result.set(name, value);
                }
            });
            result.acceptChanges();
            return result;
        };    /**
         * @name Types/_entity/Record#filterFields
         * @function
         * Создает запись c указанным набором полей
         * @param {Types/_entity/Record} record Исходная запись
         * @param {Array.<String>} fields Набор полей, которые следует оставить в записи
         * @return {Types/_entity/Record}
         * @static
         */
        /**
         * @name Types/_entity/Record#filterFields
         * @function
         * Создает запись c указанным набором полей
         * @param {Types/_entity/Record} record Исходная запись
         * @param {Array.<String>} fields Набор полей, которые следует оставить в записи
         * @return {Types/_entity/Record}
         * @static
         */
        Record.filterFields = function (record, fields) {
            if (!(fields instanceof Array)) {
                throw new TypeError('Argument "fields" should be an instance of Array');
            }
            return Record.filter(record, function (name) {
                return fields.indexOf(name) > -1;
            });
        };
        return Record;
    }(util_1.mixin(DestroyableMixin_1.default, OptionsToPropertyMixin_1.default, ObservableMixin_1.default, SerializableMixin_1.default, CloneableMixin_1.default, ManyToManyMixin_1.default, ReadWriteMixin_1.default, FormattableMixin_1.default, VersionableMixin_1.default));
    exports.default = Record;
    Object.assign(Record.prototype, {
        '[Types/_entity/Record]': true,
        '[Types/_collection/IEnumerable]': true,
        '[Types/_entity/ICloneable]': true,
        '[Types/_entity/IEquatable]': true,
        '[Types/_entity/IObject]': true,
        '[Types/_entity/IObservableObject]': true,
        '[Types/_entity/IProducible]': true,
        '[Types/_entity/IVersionable]': true,
        '[Types/_entity/relation/IReceiver]': true,
        _moduleName: 'Types/entity:Record',
        _$state: STATES.DETACHED,
        _$cacheMode: CACHE_MODE_OBJECTS,
        _$cloneChanged: false,
        _$owner: null,
        _acceptedState: undefined
    });    /**
     * {Object} Измененные поля и оригинальные значения
     */
    /**
     * {Object} Измененные поля и оригинальные значения
     */
    Record.prototype[$changedFields] = null;    // FIXME: backward compatibility for check via Core/core-instance::instanceOfModule()
    // FIXME: backward compatibility for check via Core/core-instance::instanceOfModule()
    Record.prototype['[WS.Data/Entity/Record]'] = true;    // FIXME: backward compatibility for check via Core/core-instance::instanceOfMixin()
    // FIXME: backward compatibility for check via Core/core-instance::instanceOfMixin()
    Record.prototype['[WS.Data/Collection/IEnumerable]'] = true;
    Record.prototype['[WS.Data/Entity/ICloneable]'] = true;
    di_1.register('Types/entity:Record', Record, { instantiate: false });
});