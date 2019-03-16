/// <amd-module name="Types/_entity/format" />
/**
 * Formats library.
 * @library Types/_entity/format
 * @includes Field Types/_entity/format/Field
 * @includes ArrayField Types/_entity/format/ArrayField
 * @includes BinaryField Types/_entity/format/BinaryField
 * @includes BooleanField Types/_entity/format/BooleanField
 * @includes DateField Types/_entity/format/DateField
 * @includes DateTimeField Types/_entity/format/DateTimeField
 * @includes DictionaryField Types/_entity/format/DictionaryField
 * @includes EnumField Types/_entity/format/EnumField
 * @includes fieldsFactory Types/_entity/format/fieldsFactory
 * @includes FlagsField Types/_entity/format/FlagsField
 * @includes HierarchyField Types/_entity/format/HierarchyField
 * @includes IdentityField Types/_entity/format/IdentityField
 * @includes IntegerField Types/_entity/format/IntegerField
 * @includes LinkField Types/_entity/format/LinkField
 * @includes MoneyField Types/_entity/format/MoneyField
 * @includes ObjectField Types/_entity/format/ObjectField
 * @includes RealField Types/_entity/format/RealField
 * @includes RecordField Types/_entity/format/RecordField
 * @includes RecordSetField Types/_entity/format/RecordSetField
 * @includes RpcFileField Types/_entity/format/RpcFileField
 * @includes StringField Types/_entity/format/StringField
 * @includes TimeField Types/_entity/format/TimeField
 * @includes TimeIntervalField Types/_entity/format/TimeIntervalField
 * @includes UniversalField Types/_entity/format/UniversalField
 * @includes UuidField Types/_entity/format/UuidField
 * @includes UuidField Types/_entity/format/UuidField
 * @includes XmlField Types/_entity/format/XmlField
 * @author Мальцев А.А.
 */
define('Types/_entity/format', [
    'require',
    'exports',
    'Types/_entity/format/Field',
    'Types/_entity/format/ArrayField',
    'Types/_entity/format/BinaryField',
    'Types/_entity/format/BooleanField',
    'Types/_entity/format/DateField',
    'Types/_entity/format/DateTimeField',
    'Types/_entity/format/DictionaryField',
    'Types/_entity/format/EnumField',
    'Types/_entity/format/fieldsFactory',
    'Types/_entity/format/FlagsField',
    'Types/_entity/format/HierarchyField',
    'Types/_entity/format/IdentityField',
    'Types/_entity/format/IntegerField',
    'Types/_entity/format/LinkField',
    'Types/_entity/format/MoneyField',
    'Types/_entity/format/ObjectField',
    'Types/_entity/format/RealField',
    'Types/_entity/format/RecordField',
    'Types/_entity/format/RecordSetField',
    'Types/_entity/format/RpcFileField',
    'Types/_entity/format/StringField',
    'Types/_entity/format/TimeField',
    'Types/_entity/format/TimeIntervalField',
    'Types/_entity/format/UniversalField',
    'Types/_entity/format/UuidField',
    'Types/_entity/format/XmlField'
], function (require, exports, Field_1, ArrayField_1, BinaryField_1, BooleanField_1, DateField_1, DateTimeField_1, DictionaryField_1, EnumField_1, fieldsFactory_1, FlagsField_1, HierarchyField_1, IdentityField_1, IntegerField_1, LinkField_1, MoneyField_1, ObjectField_1, RealField_1, RecordField_1, RecordSetField_1, RpcFileField_1, StringField_1, TimeField_1, TimeIntervalField_1, UniversalField_1, UuidField_1, XmlField_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.Field = Field_1.default;
    exports.ArrayField = ArrayField_1.default;
    exports.BinaryField = BinaryField_1.default;
    exports.BooleanField = BooleanField_1.default;
    exports.DateField = DateField_1.default;
    exports.DateTimeField = DateTimeField_1.default;
    exports.DictionaryField = DictionaryField_1.default;
    exports.EnumField = EnumField_1.default;
    exports.fieldsFactory = fieldsFactory_1.default;
    exports.IFieldDeclaration = fieldsFactory_1.IDeclaration;
    exports.FlagsField = FlagsField_1.default;
    exports.HierarchyField = HierarchyField_1.default;
    exports.IdentityField = IdentityField_1.default;
    exports.IntegerField = IntegerField_1.default;
    exports.LinkField = LinkField_1.default;
    exports.MoneyField = MoneyField_1.default;
    exports.ObjectField = ObjectField_1.default;
    exports.RealField = RealField_1.default;
    exports.RecordField = RecordField_1.default;
    exports.RecordSetField = RecordSetField_1.default;
    exports.RpcFileField = RpcFileField_1.default;
    exports.StringField = StringField_1.default;
    exports.TimeField = TimeField_1.default;
    exports.TimeIntervalField = TimeIntervalField_1.default;
    exports.UniversalField = UniversalField_1.default;
    exports.UuidField = UuidField_1.default;
    exports.XmlField = XmlField_1.default;
});