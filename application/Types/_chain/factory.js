/// <amd-module name="Types/_chain/factory" />
/**
 * Создает последовательную цепочку вызовов, обрабатывающих коллекции различных типов.
 *
 * Выберем из массива имена персонажей женского пола, отсортированные по имени:
 * <pre>
 * requirejs(['Types/Chain'], function(chain) {
 *    chain([
 *       {name: 'Philip J. Fry', gender: 'M'},
 *       {name: 'Turanga Leela', gender: 'F'},
 *       {name: 'Professor Farnsworth', gender: 'M'},
 *       {name: 'Amy Wong', gender: 'F'},
 *       {name: 'Bender Bending Rodriguez', gender: 'R'}
 *    ]).filter(function(item) {
 *       return item.gender === 'F';
 *    }).map(function(item) {
 *       return item.name;
 *    }).sort(function(a, b) {
 *       return a > b;
 *    }).value();
 *    //['Amy Wong', 'Turanga Leela']
 * });
 * </pre>
 * Выберем из рекордсета персонажей женского пола, отсортированных по имени:
 * <pre>
 * requirejs([
 *    'Types/Chain',
 *    'Types/Collection/RecordSet'
 * ], function(
 *    chain,
 *    RecordSet
 * ) {
 *    chain(new RecordSet({rawData: [
 *       {name: 'Philip J. Fry', gender: 'M'},
 *       {name: 'Turanga Leela', gender: 'F'},
 *       {name: 'Professor Farnsworth', gender: 'M'},
 *       {name: 'Amy Wong', gender: 'F'},
 *       {name: 'Bender Bending Rodriguez', gender: 'R'}
 *    ]})).filter(function(item) {
 *       return item.get('gender') === 'F';
 *    }).sort(function(a, b) {
 *       return a.get('name') > b.get('name');
 *    }).value();
 *    //[Model(Amy Wong), Model(Turanga Leela)]
 * });
 * </pre>
 * Другие примеры смотрите в описании методов класса {@link Types/Chain/Abstract}.
 *
 * @class Types/Chain
 * @public
 * @author Мальцев А.А.
 */
define('Types/_chain/factory', [
    'require',
    'exports',
    'Types/di',
    'Types/_chain/Abstract',
    'Types/_chain/Arraywise',
    'Types/_chain/Objectwise',
    'Types/_chain/Enumerable',
    'Types/_chain/Concatenated',
    'Types/_chain/Counted',
    'Types/_chain/Filtered',
    'Types/_chain/Flattened',
    'Types/_chain/Grouped',
    'Types/_chain/Mapped',
    'Types/_chain/Reversed',
    'Types/_chain/Sliced',
    'Types/_chain/Sorted',
    'Types/_chain/Uniquely',
    'Types/_chain/Zipped'
], function (require, exports, di_1, Abstract_1, Arraywise_1, Objectwise_1, Enumerable_1, Concatenated_1, Counted_1, Filtered_1, Flattened_1, Grouped_1, Mapped_1, Reversed_1, Sliced_1, Sorted_1, Uniquely_1, Zipped_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    di_1.register('Types/chain:DestroyableMixin', Abstract_1.default, { instantiate: false });
    di_1.register('Types/chain:Arraywise', Arraywise_1.default, { instantiate: false });
    di_1.register('Types/chain:Concatenated', Concatenated_1.default, { instantiate: false });
    di_1.register('Types/chain:Counted', Counted_1.default, { instantiate: false });
    di_1.register('Types/chain:Enumerable', Enumerable_1.default, { instantiate: false });
    di_1.register('Types/chain:Filtered', Filtered_1.default, { instantiate: false });
    di_1.register('Types/chain:Flattened', Flattened_1.default, { instantiate: false });
    di_1.register('Types/chain:Grouped', Grouped_1.default, { instantiate: false });
    di_1.register('Types/chain:Mapped', Mapped_1.default, { instantiate: false });
    di_1.register('Types/chain:Objectwise', Objectwise_1.default, { instantiate: false });
    di_1.register('Types/chain:Reversed', Reversed_1.default, { instantiate: false });
    di_1.register('Types/chain:Sliced', Sliced_1.default, { instantiate: false });
    di_1.register('Types/chain:Sorted', Sorted_1.default, { instantiate: false });
    di_1.register('Types/chain:Uniquely', Uniquely_1.default, { instantiate: false });
    di_1.register('Types/chain:Zipped', Zipped_1.default, { instantiate: false });
    function factory(source) {
        if (source instanceof Abstract_1.default) {
            return source;
        } else if (source && source['[Types/_collection/IEnumerable]']) {
            return new Enumerable_1.default(source);
        } else if (source instanceof Array) {
            return new Arraywise_1.default(source);
        } else if (source instanceof Object) {
            return new Objectwise_1.default(source);
        }
        throw new TypeError('Unsupported source type "' + source + '": only Array or Object are supported.');
    }
    exports.default = factory;
});