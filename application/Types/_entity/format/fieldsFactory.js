/// <amd-module name="Types/_entity/format/fieldsFactory" />
/**
 * Фабрика полей - конструирует поля по декларативному описанию
 * @author Мальцев А.А.
 */
define('Types/_entity/format/fieldsFactory', [
    'require',
    'exports',
    'Types/_entity/format/BooleanField',
    'Types/_entity/format/IntegerField',
    'Types/_entity/format/RealField',
    'Types/_entity/format/MoneyField',
    'Types/_entity/format/StringField',
    'Types/_entity/format/XmlField',
    'Types/_entity/format/DateTimeField',
    'Types/_entity/format/DateField',
    'Types/_entity/format/TimeField',
    'Types/_entity/format/TimeIntervalField',
    'Types/_entity/format/LinkField',
    'Types/_entity/format/IdentityField',
    'Types/_entity/format/EnumField',
    'Types/_entity/format/FlagsField',
    'Types/_entity/format/RecordField',
    'Types/_entity/format/RecordSetField',
    'Types/_entity/format/BinaryField',
    'Types/_entity/format/UuidField',
    'Types/_entity/format/RpcFileField',
    'Types/_entity/format/ObjectField',
    'Types/_entity/format/ArrayField',
    'Types/di',
    'Types/util'
], function (require, exports, BooleanField_1, IntegerField_1, RealField_1, MoneyField_1, StringField_1, XmlField_1, DateTimeField_1, DateField_1, TimeField_1, TimeIntervalField_1, LinkField_1, IdentityField_1, EnumField_1, FlagsField_1, RecordField_1, RecordSetField_1, BinaryField_1, UuidField_1, RpcFileField_1, ObjectField_1, ArrayField_1, di_1, util_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * @typedef {String} FieldType
     * @variant boolean Логическое
     * @variant integer Число целое
     * @variant real Число вещественное
     * @variant money Деньги
     * @variant string Строка
     * @variant xml Строка в формате XML
     * @variant datetime Дата и время
     * @variant date Дата
     * @variant time Время
     * @variant timeinterval Временной интервал
     * @variant identity Идентификатор
     * @variant enum Перечисляемое
     * @variant flags Флаги
     * @variant record Запись
     * @variant model Модель
     * @variant recordset Выборка
     * @variant binary Двоичное
     * @variant uuid UUID
     * @variant rpcfile Файл-RPC
     * @variant object Объект
     * @variant array Массив
     */
                                                                      /**
     * @typedef {Object} FieldDeclaration
     * @property {String} name Имя поля
     * @property {FieldType|Function|String} type Тип поля (название или конструктор)
     * @property {*} defaultValue Значение поля по умолчанию
     * @property {Boolean} nullable Значение может быть null
     * @property {*} [*] Доступны любые опции, которые можно передавать в конструктор (Types/_entity/format/*Field) данного типа поля. Например опция precision для типа @{link Types/_entity/format/MoneyField money}: {name: 'amount', type: 'money', precision: 4}
     */
                                                                      /**
     * Конструирует формат поля по декларативному описанию
     * @param {FieldDeclaration} declaration Декларативное описание
     * @return {Types/_entity/format/Field}
     */
    /**
     * @typedef {String} FieldType
     * @variant boolean Логическое
     * @variant integer Число целое
     * @variant real Число вещественное
     * @variant money Деньги
     * @variant string Строка
     * @variant xml Строка в формате XML
     * @variant datetime Дата и время
     * @variant date Дата
     * @variant time Время
     * @variant timeinterval Временной интервал
     * @variant identity Идентификатор
     * @variant enum Перечисляемое
     * @variant flags Флаги
     * @variant record Запись
     * @variant model Модель
     * @variant recordset Выборка
     * @variant binary Двоичное
     * @variant uuid UUID
     * @variant rpcfile Файл-RPC
     * @variant object Объект
     * @variant array Массив
     */
    /**
     * @typedef {Object} FieldDeclaration
     * @property {String} name Имя поля
     * @property {FieldType|Function|String} type Тип поля (название или конструктор)
     * @property {*} defaultValue Значение поля по умолчанию
     * @property {Boolean} nullable Значение может быть null
     * @property {*} [*] Доступны любые опции, которые можно передавать в конструктор (Types/_entity/format/*Field) данного типа поля. Например опция precision для типа @{link Types/_entity/format/MoneyField money}: {name: 'amount', type: 'money', precision: 4}
     */
    /**
     * Конструирует формат поля по декларативному описанию
     * @param {FieldDeclaration} declaration Декларативное описание
     * @return {Types/_entity/format/Field}
     */
    function default_1(declaration) {
        if (Object.getPrototypeOf(declaration) !== Object.prototype) {
            throw new TypeError('Types/_entity/format/FieldsFactory::create(): declaration should be an instance of Object');
        }
        var type = declaration.type;
        if (typeof type === 'string') {
            switch (type.toLowerCase()) {
            case 'boolean':
                return new BooleanField_1.default(declaration);
            case 'integer':
                return new IntegerField_1.default(declaration);
            case 'real':
                return new RealField_1.default(declaration);
            case 'money':
                return new MoneyField_1.default(declaration);
            case 'string':
                return new StringField_1.default(declaration);
            case 'text':
                util_1.logger.error('Types/_entity/format/FieldsFactory::create()', 'Type "text" has been removed in 3.18.10. Use "string" instead.');
                declaration.type = 'string';
                return new StringField_1.default(declaration);
            case 'xml':
                return new XmlField_1.default(declaration);
            case 'datetime':
                return new DateTimeField_1.default(declaration);
            case 'date':
                return new DateField_1.default(declaration);
            case 'time':
                return new TimeField_1.default(declaration);
            case 'timeinterval':
                return new TimeIntervalField_1.default(declaration);
            case 'link':
                return new LinkField_1.default(declaration);
            case 'identity':
                return new IdentityField_1.default(declaration);
            case 'enum':
                return new EnumField_1.default(declaration);
            case 'flags':
                return new FlagsField_1.default(declaration);
            case 'record':
            case 'model':
                return new RecordField_1.default(declaration);
            case 'recordset':
                return new RecordSetField_1.default(declaration);
            case 'binary':
                return new BinaryField_1.default(declaration);
            case 'uuid':
                return new UuidField_1.default(declaration);
            case 'rpcfile':
                return new RpcFileField_1.default(declaration);
            case 'hierarchy':
                util_1.logger.error('Types/_entity/format/FieldsFactory::create()', 'Type "hierarchy" has been removed in 3.18.10. Use "identity" instead.');
                declaration.type = 'identity';
                return new IdentityField_1.default(declaration);
            case 'object':
                return new ObjectField_1.default(declaration);
            case 'array':
                return new ArrayField_1.default(declaration);
            }
            if (di_1.isRegistered(type)) {
                type = di_1.resolve(type);
            }
        }
        if (typeof type === 'function') {
            var inst = Object.create(type.prototype);
            if (inst['[Types/_entity/IObject]'] && inst['[Types/_entity/FormattableMixin]']) {
                //Yes it's Types/_entity/Record
                return new RecordField_1.default(declaration);
            } else if (inst['[Types/_collection/IList]'] && inst['[Types/_entity/FormattableMixin]']) {
                //Yes it's Types/_collection/RecordSet
                return new RecordSetField_1.default(declaration);
            } else if (inst['[Types/_collection/IEnum]']) {
                return new EnumField_1.default(declaration);
            } else if (inst['[Types/_collection/IFlags]']) {
                return new FlagsField_1.default(declaration);
            } else if (inst instanceof Array) {
                return new ArrayField_1.default(declaration);
            } else if (inst instanceof Date) {
                return new DateField_1.default(declaration);
            } else if (inst instanceof String) {
                return new StringField_1.default(declaration);
            } else if (inst instanceof Number) {
                return new RealField_1.default(declaration);
            } else if (type === Object) {
                return new ObjectField_1.default(declaration);
            }
        }
        throw new TypeError('Types/_entity/format/fieldsFactory(): unsupported field type ' + (typeof type === 'function' ? type.name : '"' + type + '"'));
    }
    exports.default = default_1;
});