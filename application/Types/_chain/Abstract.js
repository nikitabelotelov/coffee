/// <amd-module name="Types/_chain/Abstract" />
/**
 * Абстрактная цепочка.
 * Это абстрактный класс, не предназначенный для создания самостоятельных экземпляров.
 * @class Types/_chain/Abstract
 * @mixes Types/_entity/DestroyableMixin
 * @implements Types/_collection/IEnumerable
 * @public
 * @author Мальцев А.А.
 */
define('Types/_chain/Abstract', [
    'require',
    'exports',
    'tslib',
    'Types/entity',
    'Types/util',
    'Types/di'
], function (require, exports, tslib_1, entity_1, util_1, di_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Abstract = /** @class */
    function (_super) {
        tslib_1.__extends(Abstract, _super);    /**
         * Конструктор цепочки
         * @param {Types/_chain/Abstract|*} source Данные, обрабатываемые цепочкой
         */
        /**
         * Конструктор цепочки
         * @param {Types/_chain/Abstract|*} source Данные, обрабатываемые цепочкой
         */
        function Abstract(source) {
            var _this = _super.call(this) || this;
            _this['[Types/_collection/IEnumerable]'] = true;
            if (source['[Types/_chain/Abstract]']) {
                _this._previous = source;
                _this._source = _this._previous._source;
            } else {
                _this._source = source;
            }
            return _this;
        }
        Object.defineProperty(Abstract.prototype, 'start', {
            /**
             * @property {Types/_chain/Abstract} Первый элемент цепочки
             */
            get: function () {
                return this._previous ? this._previous.start : this;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Abstract.prototype, 'shouldSaveIndices', {
            /**
             * @property {Boolean} Требуется сохранять оригинальные индексы элементов
             */
            get: function () {
                return this._previous ? this._previous.shouldSaveIndices : true;
            },
            enumerable: true,
            configurable: true
        });    // endregion Ordering
               // endregion Public methods
               // region Static methods
        // endregion Ordering
        // endregion Public methods
        // region Static methods
        Abstract.propertyMapper = function (name) {
            if (typeof name === 'function') {
                return name;
            }
            if (name === undefined) {
                return function (item) {
                    return item;
                };
            }
            return function (item) {
                return util_1.object.getPropertyValue(item, name);
            };
        };
        Abstract.prototype.destroy = function () {
            this._source = null;
            this._previous = null;
            _super.prototype.destroy.call(this);
        };    // region Types/_collection/IEnumerable
        // region Types/_collection/IEnumerable
        Abstract.prototype.getEnumerator = function () {
            throw new Error('Not implemented');
        };    /**
         * Перебирает все элементы коллекции, начиная с первого.
         * @param {Function(*, *)} callback Колбэк для каждого элемента (аргументами придут элемент коллекции и его индекс)
         * @param {Object} [context] Контекст вызова callback
         * @example
         * Получим элементы коллекции:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory({foo: 'Foo', bar: 'Bar'}).each((value, key) => {
         *    console.log('key: ' + key + ', value: ' + value);
         * });
         * //'key: foo, value: Foo', 'key: bar, value: Bar'
         * </pre>
         */
        /**
         * Перебирает все элементы коллекции, начиная с первого.
         * @param {Function(*, *)} callback Колбэк для каждого элемента (аргументами придут элемент коллекции и его индекс)
         * @param {Object} [context] Контекст вызова callback
         * @example
         * Получим элементы коллекции:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory({foo: 'Foo', bar: 'Bar'}).each((value, key) => {
         *    console.log('key: ' + key + ', value: ' + value);
         * });
         * //'key: foo, value: Foo', 'key: bar, value: Bar'
         * </pre>
         */
        Abstract.prototype.each = function (callback, context) {
            var enumerator = this.getEnumerator();
            while (enumerator.moveNext()) {
                callback.call(context || this, enumerator.getCurrent(), enumerator.getCurrentIndex());
            }
        };    // endregion Types/_collection/IEnumerable
              // region Public methods
              // region Summary
              /**
         * Запускает вычисление цепочки и возвращает полученное значение. Большинство цепочек возвращает массив, но
         * некоторые могут вернуть другой тип, в зависимости от вида исходной коллекции.
         * При передаче аргумента factory вернется тип значения, сконструированный фабрикой. Доступные стандартные фабрики
         * можно посмотреть в разделе {@link Types/_collection/Factory}.
         * @param {function(Types/_collection/IEnumerable): *} [factory] Фабрика для преобразования коллекции.
         * @param {...*} [optional] Дополнительные аргументы фабрики, придут в factory вторым, третьим и т.д аргументами.
         * @return {*}
         * @example
         * Получим четные отрицательные числа в виде массива:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 4, 5])
         *    .map((item) => -1 * item)
         *    .filter((item) => item % 2 === 0)
         *    .value();//[-2, -4]
         * </pre>
         * Получим рекордсет из персонажей женского пола, отсортированных по имени:
         * <pre>
         * import {factory} from 'Types/chain';
         * import {RecordSet, factory} from 'Types/collection';
         * factory(new RecordSet({rawData: [
         *    {name: 'Philip J. Fry', gender: 'M'},
         *    {name: 'Turanga Leela', gender: 'F'},
         *    {name: 'Professor Farnsworth', gender: 'M'},
         *    {name: 'Amy Wong', gender: 'F'},
         *    {name: 'Bender Bending Rodriguez', gender: 'R'}
         * ]}))
         *    .filter((item) => item.get('gender') === 'F')
         *    .sort((a, b) => a.get('name') - b.get('name'))
         *    .value(factory.recordSet);
         * //RecordSet([Model(Amy Wong), Model(Turanga Leela)])
         * </pre>
         * Получим рекордсет с адаптером для БЛ СБИС:
         * <pre>
         * import {factory} from 'Types/chain';
         * import {SbisService} from 'Types/source';
         * import {factory} from 'Types/collection';
         * const dataSource = new SbisService({endpoint: 'Employee'});
         * dataSource.query().addCallback((response) => {
         *    const items = factory(response.getAll())
         *       .first(10)
         *       .value(factory.recordSet, {
         *          adapter: response.getAdapter()
         *       });
         *    //Do something with items
         * });
         * </pre>
         */
        // endregion Types/_collection/IEnumerable
        // region Public methods
        // region Summary
        /**
         * Запускает вычисление цепочки и возвращает полученное значение. Большинство цепочек возвращает массив, но
         * некоторые могут вернуть другой тип, в зависимости от вида исходной коллекции.
         * При передаче аргумента factory вернется тип значения, сконструированный фабрикой. Доступные стандартные фабрики
         * можно посмотреть в разделе {@link Types/_collection/Factory}.
         * @param {function(Types/_collection/IEnumerable): *} [factory] Фабрика для преобразования коллекции.
         * @param {...*} [optional] Дополнительные аргументы фабрики, придут в factory вторым, третьим и т.д аргументами.
         * @return {*}
         * @example
         * Получим четные отрицательные числа в виде массива:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 4, 5])
         *    .map((item) => -1 * item)
         *    .filter((item) => item % 2 === 0)
         *    .value();//[-2, -4]
         * </pre>
         * Получим рекордсет из персонажей женского пола, отсортированных по имени:
         * <pre>
         * import {factory} from 'Types/chain';
         * import {RecordSet, factory} from 'Types/collection';
         * factory(new RecordSet({rawData: [
         *    {name: 'Philip J. Fry', gender: 'M'},
         *    {name: 'Turanga Leela', gender: 'F'},
         *    {name: 'Professor Farnsworth', gender: 'M'},
         *    {name: 'Amy Wong', gender: 'F'},
         *    {name: 'Bender Bending Rodriguez', gender: 'R'}
         * ]}))
         *    .filter((item) => item.get('gender') === 'F')
         *    .sort((a, b) => a.get('name') - b.get('name'))
         *    .value(factory.recordSet);
         * //RecordSet([Model(Amy Wong), Model(Turanga Leela)])
         * </pre>
         * Получим рекордсет с адаптером для БЛ СБИС:
         * <pre>
         * import {factory} from 'Types/chain';
         * import {SbisService} from 'Types/source';
         * import {factory} from 'Types/collection';
         * const dataSource = new SbisService({endpoint: 'Employee'});
         * dataSource.query().addCallback((response) => {
         *    const items = factory(response.getAll())
         *       .first(10)
         *       .value(factory.recordSet, {
         *          adapter: response.getAdapter()
         *       });
         *    //Do something with items
         * });
         * </pre>
         */
        Abstract.prototype.value = function (factory) {
            var optional = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                optional[_i - 1] = arguments[_i];
            }
            if (factory instanceof Function) {
                var args = [this].concat(optional);
                return factory.apply(void 0, args);
            }
            return this.toArray();
        };    /**
         * Запускает вычисление цепочки и возвращает полученное значение в виде массива.
         * @return {Array}
         * @example
         * Получим значения полей объекта в виде массива:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory({
         *    email: 'root@server.name',
         *    login: 'root'
         * }).toArray();//['root@server.name', 'root']
         * </pre>
         * Представим список в виде массива:
         * <pre>
         * import {factory} from 'Types/chain';
         * import {List} from 'Types/collection';
         * factory(new List({
         *    items: [
         *       {id: 1, name: 'SpongeBob SquarePants'},
         *       {id: 2, name: 'Patrick Star'}
         *    ]
         * })).toArray();//[{id: 1, name: 'SpongeBob SquarePants'}, {id: 2, name: 'Patrick Star'}]
         * </pre>
         */
        /**
         * Запускает вычисление цепочки и возвращает полученное значение в виде массива.
         * @return {Array}
         * @example
         * Получим значения полей объекта в виде массива:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory({
         *    email: 'root@server.name',
         *    login: 'root'
         * }).toArray();//['root@server.name', 'root']
         * </pre>
         * Представим список в виде массива:
         * <pre>
         * import {factory} from 'Types/chain';
         * import {List} from 'Types/collection';
         * factory(new List({
         *    items: [
         *       {id: 1, name: 'SpongeBob SquarePants'},
         *       {id: 2, name: 'Patrick Star'}
         *    ]
         * })).toArray();//[{id: 1, name: 'SpongeBob SquarePants'}, {id: 2, name: 'Patrick Star'}]
         * </pre>
         */
        Abstract.prototype.toArray = function () {
            var result = [];
            this.each(function (item) {
                result.push(item);
            });
            return result;
        };    /**
         * Запускает вычисление цепочки и возвращает полученное значение в виде объекта.
         * @return {Object}
         * @example
         * Трансформируем массив в объект индекс->значение:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory(['root@server.name', 'root']).toObject();//{0: 'root@server.name', 1: 'root']}
         * </pre>
         * Представим запись в виде объекта:
         * <pre>
         * import {factory} from 'Types/chain';
         * import {Record} from 'Types/entity';
         * const record = new Record({
         *    rawData: {id: 1, title: 'New One'}
         *  });
         * factory(record).toObject();//{id: 1, title: 'New One'}
         * </pre>
         */
        /**
         * Запускает вычисление цепочки и возвращает полученное значение в виде объекта.
         * @return {Object}
         * @example
         * Трансформируем массив в объект индекс->значение:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory(['root@server.name', 'root']).toObject();//{0: 'root@server.name', 1: 'root']}
         * </pre>
         * Представим запись в виде объекта:
         * <pre>
         * import {factory} from 'Types/chain';
         * import {Record} from 'Types/entity';
         * const record = new Record({
         *    rawData: {id: 1, title: 'New One'}
         *  });
         * factory(record).toObject();//{id: 1, title: 'New One'}
         * </pre>
         */
        Abstract.prototype.toObject = function () {
            var result = {};
            var enumerator = this.getEnumerator();
            while (enumerator.moveNext()) {
                result[enumerator.getCurrentIndex()] = enumerator.getCurrent();
            }
            return result;
        };    /**
         * Сводит коллекцию к одному значению.
         * @param {function(*, *, Number): *} callback Функция, вычисляющая очередное значение.
         * Принимает аргументы: предыдущее вычисленное значение, текущий элемент, индекс текущего элемента.
         * @param {*} [initialValue] Значение первого аргумента callback, передаваемое в первый вызов.
         * Если не указано, то в первый вызов первым аргументом будет передан первый элемент коллекции.
         * @return {*}
         * @example
         * Просуммируем массив:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 4, 5]).reduce((memo, item) => memo + item);//15
         * </pre>
         */
        /**
         * Сводит коллекцию к одному значению.
         * @param {function(*, *, Number): *} callback Функция, вычисляющая очередное значение.
         * Принимает аргументы: предыдущее вычисленное значение, текущий элемент, индекс текущего элемента.
         * @param {*} [initialValue] Значение первого аргумента callback, передаваемое в первый вызов.
         * Если не указано, то в первый вызов первым аргументом будет передан первый элемент коллекции.
         * @return {*}
         * @example
         * Просуммируем массив:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 4, 5]).reduce((memo, item) => memo + item);//15
         * </pre>
         */
        Abstract.prototype.reduce = function (callback, initialValue) {
            var result = initialValue;
            var skipFirst = arguments.length < 2;
            this.each(function (item, index) {
                if (skipFirst) {
                    result = item;
                    skipFirst = false;
                    return;
                }
                result = callback(result, item, index);
            });
            return result;
        };    /**
         * Сводит коллекцию к одному значению, проходя ее справа-налево.
         * @param {function(*, *, Number): *} callback Функция, вычисляющая очередное значение.
         * Принимает аргументы: предыдущее вычисленное значение, текущий элемент, индекс текущего элемента.
         * @param {*} [initialValue] Значение первого аргумента callback, передаваемое в первый вызов.
         * Если не указано, то в первый вызов первым аргументом будет передан последний элемент коллекции.
         * @return {*}
         * @example
         * Поделим элементы массива, проходя их справа-налево:
         * <pre>
         * import {factory} from 'Types/chain';
         * import {Record} from 'Types/entity';
         * factory([2, 5, 2, 100]).reduceRight((memo, item) => item / memo);//5
         * </pre>
         */
        /**
         * Сводит коллекцию к одному значению, проходя ее справа-налево.
         * @param {function(*, *, Number): *} callback Функция, вычисляющая очередное значение.
         * Принимает аргументы: предыдущее вычисленное значение, текущий элемент, индекс текущего элемента.
         * @param {*} [initialValue] Значение первого аргумента callback, передаваемое в первый вызов.
         * Если не указано, то в первый вызов первым аргументом будет передан последний элемент коллекции.
         * @return {*}
         * @example
         * Поделим элементы массива, проходя их справа-налево:
         * <pre>
         * import {factory} from 'Types/chain';
         * import {Record} from 'Types/entity';
         * factory([2, 5, 2, 100]).reduceRight((memo, item) => item / memo);//5
         * </pre>
         */
        Abstract.prototype.reduceRight = function (callback, initialValue) {
            if (arguments.length < 2) {
                return this.reverse().reduce(callback);
            }
            return this.reverse().reduce(callback, initialValue);
        };    // endregion Summary
              // region Transformation
              /**
         * Преобразует коллекцию с использованием вызова функции-преобразователя для каждого элемента.
         * @param {function(*, Number): *} callback Функция, возвращающая новый элемент.
         * Принимает аргументы: элемент коллекции и его порядковый номер.
         * @param {Object} [thisArg] Контекст вызова callback.
         * @return {Types/_chain/Mapped}
         * @example
         * Преобразуем массив в записи:
         * <pre>
         * import {factory} from 'Types/chain';
         * import {Record} from 'Types/entity';
         * factory([
         *    {id: 1, name: 'SpongeBob SquarePants'},
         *    {id: 2, name: 'Patrick Star'}
         * ]).map(
         *    (item) => new Record({rawData: item})
         * ).value();//[Record({id: 1, name: 'SpongeBob SquarePants'}), Record({id: 2, name: 'Patrick Star'})]
         * </pre>
         */
        // endregion Summary
        // region Transformation
        /**
         * Преобразует коллекцию с использованием вызова функции-преобразователя для каждого элемента.
         * @param {function(*, Number): *} callback Функция, возвращающая новый элемент.
         * Принимает аргументы: элемент коллекции и его порядковый номер.
         * @param {Object} [thisArg] Контекст вызова callback.
         * @return {Types/_chain/Mapped}
         * @example
         * Преобразуем массив в записи:
         * <pre>
         * import {factory} from 'Types/chain';
         * import {Record} from 'Types/entity';
         * factory([
         *    {id: 1, name: 'SpongeBob SquarePants'},
         *    {id: 2, name: 'Patrick Star'}
         * ]).map(
         *    (item) => new Record({rawData: item})
         * ).value();//[Record({id: 1, name: 'SpongeBob SquarePants'}), Record({id: 2, name: 'Patrick Star'})]
         * </pre>
         */
        Abstract.prototype.map = function (callback, thisArg) {
            var Next = di_1.resolve('Types/chain:Mapped');
            return new Next(this, callback, thisArg);
        };    /**
         * Перекомбинирует коллекцию, каждый n-ый элемент которой является массивом, первым элементом которого является n-ый
         * элемент исходной коллекции, вторым - n-ый элемент второй коллекции и т.д.
         * @param {...Array} [args] Коллекции для комбинирования.
         * @return {Types/_chain/Zipped}
         * @example
         * Скомбинируем массивы:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory(
         *    [1, 2, 3]
         * ).zip(
         *    ['one', 'two', 'three'],
         *    [true, true, false]
         * ).value();//[[1, 'one', true], [2, 'two', true], [3, 'three', false]]
         * </pre>
         */
        /**
         * Перекомбинирует коллекцию, каждый n-ый элемент которой является массивом, первым элементом которого является n-ый
         * элемент исходной коллекции, вторым - n-ый элемент второй коллекции и т.д.
         * @param {...Array} [args] Коллекции для комбинирования.
         * @return {Types/_chain/Zipped}
         * @example
         * Скомбинируем массивы:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory(
         *    [1, 2, 3]
         * ).zip(
         *    ['one', 'two', 'three'],
         *    [true, true, false]
         * ).value();//[[1, 'one', true], [2, 'two', true], [3, 'three', false]]
         * </pre>
         */
        Abstract.prototype.zip = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var Next = di_1.resolve('Types/chain:Zipped');
            return new Next(this, args);
        };    /**
         * Преобразует коллекцию в объект, используя исходную коллекцию в качестве названий свойств, а вторую - в качестве
         * значений свойств.
         * @param {Array.<*>} values Значения свойств.
         * @return {Object}
         * @example
         * Получим данные учетной записи:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory(
         *    ['login', 'password', 'email']
         * ).zipObject(
         *    ['root', '123', 'root@localhost']
         * );//{login: 'root', password: '123', email: 'root@localhost'}
         * </pre>
         */
        /**
         * Преобразует коллекцию в объект, используя исходную коллекцию в качестве названий свойств, а вторую - в качестве
         * значений свойств.
         * @param {Array.<*>} values Значения свойств.
         * @return {Object}
         * @example
         * Получим данные учетной записи:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory(
         *    ['login', 'password', 'email']
         * ).zipObject(
         *    ['root', '123', 'root@localhost']
         * );//{login: 'root', password: '123', email: 'root@localhost'}
         * </pre>
         */
        Abstract.prototype.zipObject = function (values) {
            var result = Object.create(null);
            this.zip(values).each(function (item) {
                var key = item[0], value = item[1];
                result[key] = value;
            });
            return result;
        };    /**
         * Преобразует коллекцию, возвращая значение свойства для каждого элемента.
         * @param {String} propertyName Название свойства.
         * @return {Types/_chain/Mapped}
         * @example
         * Получим имена персонажей из массива:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([
         *    {id: 1, name: 'SpongeBob SquarePants'},
         *    {id: 2, name: 'Patrick Star'}
         * ]).pluck('name').value();//['SpongeBob SquarePants', 'Patrick Star']
         * </pre>
         * Получим имена персонажей из рекордсета:
         * <pre>
         * import {factory} from 'Types/chain';
         * import {RecordSet} from 'Types/collection';
         * factory(new RecordSet({
         *    rawData: [
         *       {id: 1, name: 'SpongeBob SquarePants'},
         *       {id: 2, name: 'Patrick Star'}
         *    ]
         * })).pluck('name').value();//['SpongeBob SquarePants', 'Patrick Star']
         * </pre>
         */
        /**
         * Преобразует коллекцию, возвращая значение свойства для каждого элемента.
         * @param {String} propertyName Название свойства.
         * @return {Types/_chain/Mapped}
         * @example
         * Получим имена персонажей из массива:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([
         *    {id: 1, name: 'SpongeBob SquarePants'},
         *    {id: 2, name: 'Patrick Star'}
         * ]).pluck('name').value();//['SpongeBob SquarePants', 'Patrick Star']
         * </pre>
         * Получим имена персонажей из рекордсета:
         * <pre>
         * import {factory} from 'Types/chain';
         * import {RecordSet} from 'Types/collection';
         * factory(new RecordSet({
         *    rawData: [
         *       {id: 1, name: 'SpongeBob SquarePants'},
         *       {id: 2, name: 'Patrick Star'}
         *    ]
         * })).pluck('name').value();//['SpongeBob SquarePants', 'Patrick Star']
         * </pre>
         */
        Abstract.prototype.pluck = function (propertyName) {
            return this.map(function (item) {
                return util_1.object.getPropertyValue(item, propertyName);
            });
        };    /**
         * Преобразует коллекцию, вызывая метод каждого элемента.
         * @param {String} methodName Название метода.
         * @param {...*} [args] Аргументы метода.
         * @return {Types/_chain/Mapped}
         * @example
         * Получим список названий фруктов в верхнем регистре:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([
         *    'apple',
         *    'cherry',
         *    'banana'
         * ]).invoke('toUpperCase').value();//['APPLE', 'CHERRY', 'BANANA']
         * </pre>
         * Получим аббревиатуру из слов:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory(['What', 'you', 'see', 'is', 'what', 'you', 'get'])
         *    .invoke('substr', 0, 1)
         *    .invoke('toUpperCase')
         *    .value()
         *    .join('');//['WYSIWYG']
         * </pre>
         */
        /**
         * Преобразует коллекцию, вызывая метод каждого элемента.
         * @param {String} methodName Название метода.
         * @param {...*} [args] Аргументы метода.
         * @return {Types/_chain/Mapped}
         * @example
         * Получим список названий фруктов в верхнем регистре:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([
         *    'apple',
         *    'cherry',
         *    'banana'
         * ]).invoke('toUpperCase').value();//['APPLE', 'CHERRY', 'BANANA']
         * </pre>
         * Получим аббревиатуру из слов:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory(['What', 'you', 'see', 'is', 'what', 'you', 'get'])
         *    .invoke('substr', 0, 1)
         *    .invoke('toUpperCase')
         *    .value()
         *    .join('');//['WYSIWYG']
         * </pre>
         */
        Abstract.prototype.invoke = function (methodName) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            return this.map(function (item) {
                return item[methodName].apply(item, args);
            });
        };    /**
         * Соединяет коллекцию с другими коллекциями, добавляя их элементы в конец.
         * @param {...Array.<Array>|Array.<Types/_collection/IEnumerable>} [args] Коллекции, с которыми объединить.
         * @return {Types/_chain/Concatenated}
         * @example
         * Объединим коллекцию с двумя массивами:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2]).concat([3, 4], [5]).value();//[1, 2, 3, 4, 5]
         * </pre>
         */
        /**
         * Соединяет коллекцию с другими коллекциями, добавляя их элементы в конец.
         * @param {...Array.<Array>|Array.<Types/_collection/IEnumerable>} [args] Коллекции, с которыми объединить.
         * @return {Types/_chain/Concatenated}
         * @example
         * Объединим коллекцию с двумя массивами:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2]).concat([3, 4], [5]).value();//[1, 2, 3, 4, 5]
         * </pre>
         */
        Abstract.prototype.concat = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var Next = di_1.resolve('Types/chain:Concatenated');
            return new Next(this, args);
        };    /**
         * Разворачивает иерархическую коллекцию в плоскую: каждый итерируемый элемент коллекции рекрурсивно вставляется
         * в виде коллекции.
         * @return {Types/_chain/Flattened}
         * @example
         * Развернем массив:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, [2], [3, [[4, [5]]]]]).flatten().value();//[1, 2, 3, 4, 5]
         * </pre>
         */
        /**
         * Разворачивает иерархическую коллекцию в плоскую: каждый итерируемый элемент коллекции рекрурсивно вставляется
         * в виде коллекции.
         * @return {Types/_chain/Flattened}
         * @example
         * Развернем массив:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, [2], [3, [[4, [5]]]]]).flatten().value();//[1, 2, 3, 4, 5]
         * </pre>
         */
        Abstract.prototype.flatten = function () {
            var Next = di_1.resolve('Types/chain:Flattened');
            return new Next(this);
        };    /**
         * Группирует коллекцию, создавая новую из элементов, сгруппированных в массивы.
         * @param {String|Function(*): String} key Поле группировки или функция, группировки для каждого элемента.
         * @param {String|Function(*): *} [value] Поле значения или функция, возвращающая значение для каждого элемента.
         * @return {Types/_chain/Grouped}
         * @example
         * Сгруппируем четные и нечетные значения массива:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 4, 5])
         *    .group((item) => item % 2 === 0)
         *    .value();//[[1, 3, 5], [2, 4]]
         * </pre>
         * Сгруппируем значения по полю kind:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([
         *    {title: 'Apple', kind: 'fruit'},
         *    {title: 'Cherry', kind: 'fruit'},
         *    {title: 'Cucumber', kind: 'vegetable'},
         *    {title: 'Pear', kind: 'fruit'},
         *    {title: 'Potato', kind: 'vegetable'}
         * ]).group('kind', 'title').toObject();//{fruit: ['Apple', 'Cherry', 'Pear'], vegetable: ['Cucumber', 'Potato']}
         * </pre>
         */
        /**
         * Группирует коллекцию, создавая новую из элементов, сгруппированных в массивы.
         * @param {String|Function(*): String} key Поле группировки или функция, группировки для каждого элемента.
         * @param {String|Function(*): *} [value] Поле значения или функция, возвращающая значение для каждого элемента.
         * @return {Types/_chain/Grouped}
         * @example
         * Сгруппируем четные и нечетные значения массива:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 4, 5])
         *    .group((item) => item % 2 === 0)
         *    .value();//[[1, 3, 5], [2, 4]]
         * </pre>
         * Сгруппируем значения по полю kind:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([
         *    {title: 'Apple', kind: 'fruit'},
         *    {title: 'Cherry', kind: 'fruit'},
         *    {title: 'Cucumber', kind: 'vegetable'},
         *    {title: 'Pear', kind: 'fruit'},
         *    {title: 'Potato', kind: 'vegetable'}
         * ]).group('kind', 'title').toObject();//{fruit: ['Apple', 'Cherry', 'Pear'], vegetable: ['Cucumber', 'Potato']}
         * </pre>
         */
        Abstract.prototype.group = function (key, value) {
            var Next = di_1.resolve('Types/chain:Grouped');
            return new Next(this, key, value);
        };    /**
         * Агрегирует коллекцию, подсчитывая число элементов, объединенных по заданному критерию.
         * @param {String|function(*): String} [by] Поле агрегации или функция агрегации для каждого элемента.
         * Если не указан, возвращается общее количество элементов.
         * @return {Number|Types/_chain/Counted}
         * @example
         * Подсчитаем число элементов массива:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 4, 5]).count();//5
         * </pre>
         * Подсчитаем четные и нечентные значения массива:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 4, 5])
         *    .count((item) => item % 2 === 0)
         *    .value();//[3, 2]
         * </pre>
         * Подсчитаем фрукты и овощи:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([
         *    {title: 'Apple', kind: 'fruit'},
         *    {title: 'Cherry', kind: 'fruit'},
         *    {title: 'Cucumber', kind: 'vegetable'},
         *    {title: 'Pear', kind: 'fruit'},
         *    {title: 'Potato', kind: 'vegetable'}
         * ]).count('kind').toObject();//{fruit: 3, vegetable: 2}
         * </pre>
         */
        /**
         * Агрегирует коллекцию, подсчитывая число элементов, объединенных по заданному критерию.
         * @param {String|function(*): String} [by] Поле агрегации или функция агрегации для каждого элемента.
         * Если не указан, возвращается общее количество элементов.
         * @return {Number|Types/_chain/Counted}
         * @example
         * Подсчитаем число элементов массива:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 4, 5]).count();//5
         * </pre>
         * Подсчитаем четные и нечентные значения массива:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 4, 5])
         *    .count((item) => item % 2 === 0)
         *    .value();//[3, 2]
         * </pre>
         * Подсчитаем фрукты и овощи:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([
         *    {title: 'Apple', kind: 'fruit'},
         *    {title: 'Cherry', kind: 'fruit'},
         *    {title: 'Cucumber', kind: 'vegetable'},
         *    {title: 'Pear', kind: 'fruit'},
         *    {title: 'Potato', kind: 'vegetable'}
         * ]).count('kind').toObject();//{fruit: 3, vegetable: 2}
         * </pre>
         */
        Abstract.prototype.count = function (by) {
            if (by === undefined) {
                return this.reduce(function (memo) {
                    return memo + 1;
                }, 0);
            }
            var Next = di_1.resolve('Types/chain:Counted');
            return new Next(this, by);
        };    /**
         * Агрегирует коллекцию, находя максимальный элемент.
         * @return {Number}
         * @example
         * Найдем максимальный элемент массива:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 4, 5]).max();//5
         * </pre>
         */
        /**
         * Агрегирует коллекцию, находя максимальный элемент.
         * @return {Number}
         * @example
         * Найдем максимальный элемент массива:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 4, 5]).max();//5
         * </pre>
         */
        Abstract.prototype.max = function () {
            return this.reduce(function (prev, current) {
                return current > prev ? current : prev;
            });
        };    /**
         * Агрегирует коллекцию, находя минимальный элемент.
         * @return {Number}
         * @example
         * Найдем минимальный элемент массива:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 4, 5]).min();//1
         * </pre>
         */
        /**
         * Агрегирует коллекцию, находя минимальный элемент.
         * @return {Number}
         * @example
         * Найдем минимальный элемент массива:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 4, 5]).min();//1
         * </pre>
         */
        Abstract.prototype.min = function () {
            return this.reduce(function (prev, current) {
                return current < prev ? current : prev;
            });
        };    /**
         * Преобразует коллекцию, удаляя из нее повторяющиеся элементы (используется строгое сравнение ===).
         * @param {function(*): String|Number>} [idExtractor] Функция, возвращающая уникальный идентификатор элемента.
         * @return {Types/_chain/Uniquely}
         * @example
         * Оставим уникальные значения массива:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 2, 1, 0]).uniq().value();//[1, 2, 3, 0]
         * </pre>
         * Оставим элементы с уникальным значением поля kind:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([
         *    {title: 'Apple', kind: 'fruit'},
         *    {title: 'Cherry', kind: 'fruit'},
         *    {title: 'Cucumber', kind: 'vegetable'},
         *    {title: 'Pear', kind: 'fruit'},
         *    {title: 'Potato', kind: 'vegetable'}
         * ]).uniq(
         *    (item) => item.kind
         * ).value();//[{title: 'Apple', kind: 'fruit'}, {title: 'Cucumber', kind: 'vegetable'}]
         * </pre>
         */
        /**
         * Преобразует коллекцию, удаляя из нее повторяющиеся элементы (используется строгое сравнение ===).
         * @param {function(*): String|Number>} [idExtractor] Функция, возвращающая уникальный идентификатор элемента.
         * @return {Types/_chain/Uniquely}
         * @example
         * Оставим уникальные значения массива:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 2, 1, 0]).uniq().value();//[1, 2, 3, 0]
         * </pre>
         * Оставим элементы с уникальным значением поля kind:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([
         *    {title: 'Apple', kind: 'fruit'},
         *    {title: 'Cherry', kind: 'fruit'},
         *    {title: 'Cucumber', kind: 'vegetable'},
         *    {title: 'Pear', kind: 'fruit'},
         *    {title: 'Potato', kind: 'vegetable'}
         * ]).uniq(
         *    (item) => item.kind
         * ).value();//[{title: 'Apple', kind: 'fruit'}, {title: 'Cucumber', kind: 'vegetable'}]
         * </pre>
         */
        Abstract.prototype.uniq = function (idExtractor) {
            var Next = di_1.resolve('Types/chain:Uniquely');
            return new Next(this, idExtractor);
        };    /**
         * Преобразует коллекцию, добавляя в нее элементы других коллекций, которых в ней еще нет.
         * @param {...Array.<Array>|Array.<Types/_collection/IEnumerable>} [args] Коллекции, элементы которых надо добавить.
         * @return {Types/_chain/Uniquely}
         * @example
         * Оставим уникальные значения массива:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3]).union([0, 1, 2, 3, 4, 5]).value();//[1, 2, 3, 0, 4, 5]
         * </pre>
         */
        /**
         * Преобразует коллекцию, добавляя в нее элементы других коллекций, которых в ней еще нет.
         * @param {...Array.<Array>|Array.<Types/_collection/IEnumerable>} [args] Коллекции, элементы которых надо добавить.
         * @return {Types/_chain/Uniquely}
         * @example
         * Оставим уникальные значения массива:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3]).union([0, 1, 2, 3, 4, 5]).value();//[1, 2, 3, 0, 4, 5]
         * </pre>
         */
        Abstract.prototype.union = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return this.concat.apply(this, args).uniq();
        };    // endregion Transformation
              // region Filtering
              /**
         * Фильтрует коллекцию, оставляя в ней те элементы, которые прошли фильтр.
         * @param {function(*, Number): Boolean} callback Фильтр c аргументами: элемент коллекции и его порядковый номер.
         * @param {Object} [thisArg] Контекст вызова callback.
         * @return {Types/_chain/Filtered}
         * @example
         * Выберем четные значения массива:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 4, 5])
         *    .filter((item) => item % 2 === 0)
         *    .value();//[2, 4]
         * </pre>
         */
        // endregion Transformation
        // region Filtering
        /**
         * Фильтрует коллекцию, оставляя в ней те элементы, которые прошли фильтр.
         * @param {function(*, Number): Boolean} callback Фильтр c аргументами: элемент коллекции и его порядковый номер.
         * @param {Object} [thisArg] Контекст вызова callback.
         * @return {Types/_chain/Filtered}
         * @example
         * Выберем четные значения массива:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 4, 5])
         *    .filter((item) => item % 2 === 0)
         *    .value();//[2, 4]
         * </pre>
         */
        Abstract.prototype.filter = function (callback, thisArg) {
            var Next = di_1.resolve('Types/chain:Filtered');
            return new Next(this, callback, thisArg);
        };    /**
         * Фильтрует коллекцию, исключая из нее те элементы, которые прошли фильтр.
         * @param {function(*, Number): Boolean} callback Функция c аргументами: элемент коллекции и его порядковый номер.
         * @param {Object} [thisArg] Контекст вызова callback.
         * @return {Types/_chain/Filtered}
         * @example
         * Исключим значения от 2 до 4:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 4, 5])
         *    .reject((item) => item >= 2 && item <= 4)
         *    .value();//[1, 5]
         * </pre>
         */
        /**
         * Фильтрует коллекцию, исключая из нее те элементы, которые прошли фильтр.
         * @param {function(*, Number): Boolean} callback Функция c аргументами: элемент коллекции и его порядковый номер.
         * @param {Object} [thisArg] Контекст вызова callback.
         * @return {Types/_chain/Filtered}
         * @example
         * Исключим значения от 2 до 4:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 4, 5])
         *    .reject((item) => item >= 2 && item <= 4)
         *    .value();//[1, 5]
         * </pre>
         */
        Abstract.prototype.reject = function (callback, thisArg) {
            return this.filter(function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return !callback.apply(thisArg, args);
            });
        };    /**
         * Фильтрует коллекцию, оставляя в ней элементы, имеющие указанный набор значений свойств.
         * @param {Object} properties Объект, с набором проверяемых свойств и их значений.
         * @return {Types/_chain/Filtered}
         * @example
         * Получим персонажей мужского пола из дома Старков:
         * <pre>
         * import {factory} from 'Types/chain';
         * const stillAliveOrNot = [
         *    {name: 'Eddard Stark', house: 'House Stark', gender: 'm'},
         *    {name: 'Catelyn Stark', house: 'House Stark', gender: 'f'},
         *    {name: 'Jon Snow', house: 'House Stark', gender: 'm'},
         *    {name: 'Sansa Stark', house: 'House Stark', gender: 'f'},
         *    {name: 'Arya Stark', house: 'House Stark', gender: 'f'},
         *    {name: 'Daenerys Targaryen', house: 'House Targaryen', gender: 'f'},
         *    {name: 'Viserys Targaryen', house: 'House Targaryen', gender: 'm'},
         *    {name: 'Jorah Mormont', house: 'House Targaryen', gender: 'm'}
         * ];
         * factory(stillAliveOrNot).where({
         *    house: 'House Stark',
         *    gender: 'm'
         * }).value();
         * //[{name: 'Eddard Stark', house: 'House Stark', gender: 'm'},
         * //{name: 'Jon Snow', house: 'House Stark', gender: 'm'}]
         * </pre>
         */
        /**
         * Фильтрует коллекцию, оставляя в ней элементы, имеющие указанный набор значений свойств.
         * @param {Object} properties Объект, с набором проверяемых свойств и их значений.
         * @return {Types/_chain/Filtered}
         * @example
         * Получим персонажей мужского пола из дома Старков:
         * <pre>
         * import {factory} from 'Types/chain';
         * const stillAliveOrNot = [
         *    {name: 'Eddard Stark', house: 'House Stark', gender: 'm'},
         *    {name: 'Catelyn Stark', house: 'House Stark', gender: 'f'},
         *    {name: 'Jon Snow', house: 'House Stark', gender: 'm'},
         *    {name: 'Sansa Stark', house: 'House Stark', gender: 'f'},
         *    {name: 'Arya Stark', house: 'House Stark', gender: 'f'},
         *    {name: 'Daenerys Targaryen', house: 'House Targaryen', gender: 'f'},
         *    {name: 'Viserys Targaryen', house: 'House Targaryen', gender: 'm'},
         *    {name: 'Jorah Mormont', house: 'House Targaryen', gender: 'm'}
         * ];
         * factory(stillAliveOrNot).where({
         *    house: 'House Stark',
         *    gender: 'm'
         * }).value();
         * //[{name: 'Eddard Stark', house: 'House Stark', gender: 'm'},
         * //{name: 'Jon Snow', house: 'House Stark', gender: 'm'}]
         * </pre>
         */
        Abstract.prototype.where = function (properties) {
            var keys = Object.keys(properties);
            return this.filter(function (item) {
                return keys.reduce(function (prev, key) {
                    return prev && util_1.object.getPropertyValue(item, key) === properties[key];
                }, true);
            });
        };    /**
         * Возвращает первый элемент коллекции или фильтрует ее, оставляя в ней первые n элементов.
         * @param {Number} [n] Количество элементов, которые нужно выбрать. Если не указан, то возвращается первый элемент.
         * @return {Types/_chain/Sliced|*}
         * @example
         * Выберем первый элемент:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 4, 5]).first();//1
         * </pre>
         * Выберем первые 3 элемента:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 4, 5]).first(3).value();//[1, 2, 3]
         * </pre>
         */
        /**
         * Возвращает первый элемент коллекции или фильтрует ее, оставляя в ней первые n элементов.
         * @param {Number} [n] Количество элементов, которые нужно выбрать. Если не указан, то возвращается первый элемент.
         * @return {Types/_chain/Sliced|*}
         * @example
         * Выберем первый элемент:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 4, 5]).first();//1
         * </pre>
         * Выберем первые 3 элемента:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 4, 5]).first(3).value();//[1, 2, 3]
         * </pre>
         */
        Abstract.prototype.first = function (n) {
            if (n === undefined) {
                var enumerator = this.getEnumerator();
                return enumerator.moveNext() ? enumerator.getCurrent() : undefined;
            }
            var Next = di_1.resolve('Types/chain:Sliced');
            return new Next(this, 0, n);
        };    /**
         * Возвращает последний элемент коллекции или фильтрует ее, оставляя в ней последние n элементов.
         * @param {Number} [n] Количество выбираемых элементов. Если не указано, то возвращается последний элемент.
         * @return {Types/_chain/Reversed|*}
         * @example
         * Выберем последний элемент:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 4, 5]).last();//5
         * </pre>
         * Выберем последние 3 элемента:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 4, 5]).last(3).value();//[3, 4, 5]
         * </pre>
         */
        /**
         * Возвращает последний элемент коллекции или фильтрует ее, оставляя в ней последние n элементов.
         * @param {Number} [n] Количество выбираемых элементов. Если не указано, то возвращается последний элемент.
         * @return {Types/_chain/Reversed|*}
         * @example
         * Выберем последний элемент:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 4, 5]).last();//5
         * </pre>
         * Выберем последние 3 элемента:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([1, 2, 3, 4, 5]).last(3).value();//[3, 4, 5]
         * </pre>
         */
        Abstract.prototype.last = function (n) {
            if (n === undefined) {
                return this.reverse().first();
            }
            return this.reverse().first(n).reverse();
        };    // endregion Filtering
              // region Ordering
              /**
         * Меняет порядок элементов коллекции на обратный
         * @return {Types/_chain/Reversed}
         * @example
         * Изменим порядок элементов:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory(['one', 'two', 'three']).reverse().value();//['three', 'two', 'one']
         * </pre>
         */
        // endregion Filtering
        // region Ordering
        /**
         * Меняет порядок элементов коллекции на обратный
         * @return {Types/_chain/Reversed}
         * @example
         * Изменим порядок элементов:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory(['one', 'two', 'three']).reverse().value();//['three', 'two', 'one']
         * </pre>
         */
        Abstract.prototype.reverse = function () {
            var Next = di_1.resolve('Types/chain:Reversed');
            return new Next(this);
        };    /**
         * Сортирует коллекцию с использованием функции сортировки, алгоритм работы и сигнатура которой аналогичны
         * методу {@link https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Array/sort Array.prototype.sort}.
         * @param {function(*, *): Number} [compareFunction] Функция сортировки. Принимает аргументами два элемента
         * коллекции, которые нужно сравнить.
         * @return {Types/_chain/Sorted}
         * @example
         * Отсортируем массив чисел по возрастанию:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([2, 4, 3, 1, 5])
         *    .sort((a, b) => a - b)
         *    .value();//[1, 2, 3, 4, 5]
         * </pre>
         */
        /**
         * Сортирует коллекцию с использованием функции сортировки, алгоритм работы и сигнатура которой аналогичны
         * методу {@link https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Array/sort Array.prototype.sort}.
         * @param {function(*, *): Number} [compareFunction] Функция сортировки. Принимает аргументами два элемента
         * коллекции, которые нужно сравнить.
         * @return {Types/_chain/Sorted}
         * @example
         * Отсортируем массив чисел по возрастанию:
         * <pre>
         * import {factory} from 'Types/chain';
         * factory([2, 4, 3, 1, 5])
         *    .sort((a, b) => a - b)
         *    .value();//[1, 2, 3, 4, 5]
         * </pre>
         */
        Abstract.prototype.sort = function (compareFunction) {
            var Next = di_1.resolve('Types/chain:Sorted');
            return new Next(this, compareFunction);
        };
        return Abstract;
    }(entity_1.DestroyableMixin);
    exports.default = Abstract;
    Object.assign(Abstract.prototype, {
        '[Types/_chain/Abstract]': true,
        _source: null,
        _previous: null
    });
});