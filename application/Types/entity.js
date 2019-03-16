/// <amd-module name="Types/entity" />
/**
 * Библиотека типов.
 * @library Types/entity
 * @includes adapter Types/_entity/adapter
 * @includes descriptor Types/_entity/descriptor
 * @includes DestroyableMixin Types/_entity/DestroyableMixin
 * @includes factory Types/_entity/factory
 * @includes format Types/_entity/format
 * @includes functor Types/_entity/functor
 * @includes Identity Types/_entity/Identity
 * @includes ICloneable Types/_entity/ICloneable
 * @includes IEquatable Types/_entity/IEquatable
 * @includes IInstantiable Types/_entity/IInstantiable
 * @includes IObject Types/_entity/IObject
 * @includes IObservableObject Types/_entity/IObservableObject
 * @includes IProducible Types/_entity/IProducible
 * @includes IVersionable Types/_entity/IVersionable
 * @includes Model Types/_entity/Model
 * @includes Record Types/_entity/Record
 * @includes relation Types/_entity/relation
 * @public
 * @author Мальцев А.А.
 */
define('Types/entity', [
    'require',
    'exports',
    'Types/_entity/adapter',
    'Types/_entity/CloneableMixin',
    'Types/_entity/descriptor',
    'Types/_entity/DestroyableMixin',
    'Types/_entity/factory',
    'Types/_entity/format',
    'Types/_entity/FormattableMixin',
    'Types/_entity/functor',
    'Types/_entity/Identity',
    'Types/_entity/ICloneable',
    'Types/_entity/IEquatable',
    'Types/_entity/IInstantiable',
    'Types/_entity/InstantiableMixin',
    'Types/_entity/IObject',
    'Types/_entity/IObservableObject',
    'Types/_entity/IProducible',
    'Types/_entity/IVersionable',
    'Types/_entity/ManyToManyMixin',
    'Types/_entity/Model',
    'Types/_entity/OptionsToPropertyMixin',
    'Types/_entity/ObservableMixin',
    'Types/_entity/ReadWriteMixin',
    'Types/_entity/Record',
    'Types/_entity/relation',
    'Types/_entity/SerializableMixin',
    'Types/_entity/VersionableMixin',
    'Types/_entity/TimeInterval',
    'Types/_entity/Guid'
], function (require, exports, adapter, CloneableMixin_1, descriptor_1, DestroyableMixin_1, factory_1, format, FormattableMixin_1, functor, Identity_1, ICloneable_1, IEquatable_1, IInstantiable_1, InstantiableMixin_1, IObject_1, IObservableObject_1, IProducible_1, IVersionable_1, ManyToManyMixin_1, Model_1, OptionsToPropertyMixin_1, ObservableMixin_1, ReadWriteMixin_1, Record_1, relation, SerializableMixin_1, VersionableMixin_1, TimeInterval_1, Guid_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.adapter = adapter;
    exports.CloneableMixin = CloneableMixin_1.default;
    exports.descriptor = descriptor_1.default;
    exports.DestroyableMixin = DestroyableMixin_1.default;
    exports.factory = factory_1.default;
    exports.format = format;
    exports.FormattableMixin = FormattableMixin_1.default;
    exports.functor = functor;
    exports.Identity = Identity_1.default;
    exports.ICloneable = ICloneable_1.default;
    exports.IEquatable = IEquatable_1.default;
    exports.IInstantiable = IInstantiable_1.default;
    exports.InstantiableMixin = InstantiableMixin_1.default;
    exports.IObject = IObject_1.default;
    exports.IObservableObject = IObservableObject_1.default;
    exports.IProducible = IProducible_1.default;
    exports.IVersionable = IVersionable_1.default;
    exports.ManyToManyMixin = ManyToManyMixin_1.default;
    exports.Model = Model_1.default;
    exports.OptionsToPropertyMixin = OptionsToPropertyMixin_1.default;
    exports.ObservableMixin = ObservableMixin_1.default;
    exports.ReadWriteMixin = ReadWriteMixin_1.default;
    exports.Record = Record_1.default;
    exports.relation = relation;
    exports.SerializableMixin = SerializableMixin_1.default;
    exports.ISerializableState = SerializableMixin_1.IState;
    exports.VersionableMixin = VersionableMixin_1.default;
    exports.TimeInterval = TimeInterval_1.default;
    exports.Guid = Guid_1.default;
});