/// <amd-module name="Types/collection" />
/**
 * Библиотека коллекций.
 * @library Types/collection
 * @includes Array Types/_collection/Array
 * @includes enumerableComparator Types/_collection/enumerableComparator
 * @includes Dictionary Types/_collection/Dictionary
 * @includes Enum Types/_collection/Enum
 * @includes factory Types/_collection/factory
 * @includes format Types/_collection/format
 * @includes Flags Types/_collection/Flags
 * @includes IObservable Types/_collection/IObservable
 * @includes IEnum Types/_collection/IEnum
 * @includes IFlags Types/_collection/IFlags
 * @includes IEnumerable Types/_collection/IEnumerable
 * @includes IEnumerator Types/_collection/IEnumerator
 * @includes IList Types/_collection/IList
 * @includes IndexedEnumeratorMixin Types/_collection/IndexedEnumeratorMixin
 * @includes List Types/_collection/List
 * @includes Mapwise Types/_collection/Mapwise
 * @includes Objectwise Types/_collection/Objectwise
 * @includes ObservableList Types/_collection/ObservableList
 * @includes RecordSet Types/_collection/RecordSet
 * @public
 * @author Мальцев А.А.
 */
define('Types/collection', [
    'require',
    'exports',
    'Types/_collection/enumerableComparator',
    'Types/_collection/Enum',
    'Types/_collection/enumerator',
    'Types/_collection/EventRaisingMixin',
    'Types/_collection/factory',
    'Types/_collection/format',
    'Types/_collection/Flags',
    'Types/_collection/IEnum',
    'Types/_collection/IFlags',
    'Types/_collection/IEnumerable',
    'Types/_collection/IEnumerator',
    'Types/_collection/IList',
    'Types/_collection/IndexedEnumeratorMixin',
    'Types/_collection/IObservable',
    'Types/_collection/List',
    'Types/_collection/ObservableList',
    'Types/_collection/RecordSet'
], function (require, exports, enumerableComparator_1, Enum_1, enumerator, EventRaisingMixin_1, factory, format, Flags_1, IEnum_1, IFlags_1, IEnumerable_1, IEnumerator_1, IList_1, IndexedEnumeratorMixin_1, IObservable_1, List_1, ObservableList_1, RecordSet_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.enumerableComparator = enumerableComparator_1.default;
    exports.Enum = Enum_1.default;
    exports.enumerator = enumerator;
    exports.EventRaisingMixin = EventRaisingMixin_1.default;
    exports.factory = factory;
    exports.format = format;
    exports.Flags = Flags_1.default;
    exports.IEnum = IEnum_1.default;
    exports.IFlags = IFlags_1.default;
    exports.IFlagsValue = IFlags_1.IValue;
    exports.IEnumerable = IEnumerable_1.default;
    exports.EnumeratorCallback = IEnumerable_1.EnumeratorCallback;
    exports.IEnumerator = IEnumerator_1.default;
    exports.IList = IList_1.default;
    exports.IndexedEnumeratorMixin = IndexedEnumeratorMixin_1.default;
    exports.IObservable = IObservable_1.default;
    exports.List = List_1.default;
    exports.ObservableList = ObservableList_1.default;
    exports.RecordSet = RecordSet_1.default;
});