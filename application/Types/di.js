/// <amd-module name="Types/di" />
/**
 * Dependency Injection через Service Locator. Работает через алиасы.
 * @author Мальцев А.А.
 */
define('Types/di', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var map = {};    /**
     * Проверяет валидность названия зависимости
     * @param {String} alias Название зависимости
     */
    /**
     * Проверяет валидность названия зависимости
     * @param {String} alias Название зависимости
     */
    function checkAlias(alias) {
        if (typeof alias !== 'string') {
            throw new TypeError('Alias should be a string');
        }
        if (!alias) {
            throw new TypeError('Alias is empty');
        }
    }    /**
     * @typedef {Object} DependencyOptions
     * @property {Boolean} [single=false] Инстанциировать только один объект
     * @property {Boolean} [instantiate=true] Создавать новый экземпляр или использовать переданный инстанс
     */
         /**
     * Регистрирует зависимость
     * @param {String} alias Название зависимости
     * @param {Function|Object} factory Фабрика объектов или готовый инстанс
     * @param {DependencyOptions} [options] Опции
     * @example
     * Зарегистрируем модель пользователя:
     * <pre>
     *    var User = Model.extend({});
     *    di.register('model.$user', User, {instantiate: false});
     *    di.register('model.user', User);
     * </pre>
     * Зарегистрируем экземпляр текущего пользователя системы:
     * <pre>
     *    var currentUser = new Model();
     *    di.register('app.user', currentUser, {instantiate: false});
     * </pre>
     * Зарегистрируем логер, который будет singleton:
     * <pre>
     *    define(['Core/core-extend'], function(CoreExtend) {
     *       var Logger = CoreExtend.extend({
     *          log: function() {}
     *       });
     *       di.register('app.logger', Logger, {single: true});
     *    });
     * </pre>
     * Зарегистрируем модель пользователя с переопределенными аргументами конструктора:
     * <pre>
     *    define(['Core/core-merge'], function(coreMerge) {
     *       di.register('model.crm-user', function(options) {
     *          return new User(coreMerge(options, {
     *             context: 'crm',
     *             dateFormat: 'Y/m/d'
     *          }));
     *       });
     *    });
     * </pre>
     */
    /**
     * @typedef {Object} DependencyOptions
     * @property {Boolean} [single=false] Инстанциировать только один объект
     * @property {Boolean} [instantiate=true] Создавать новый экземпляр или использовать переданный инстанс
     */
    /**
     * Регистрирует зависимость
     * @param {String} alias Название зависимости
     * @param {Function|Object} factory Фабрика объектов или готовый инстанс
     * @param {DependencyOptions} [options] Опции
     * @example
     * Зарегистрируем модель пользователя:
     * <pre>
     *    var User = Model.extend({});
     *    di.register('model.$user', User, {instantiate: false});
     *    di.register('model.user', User);
     * </pre>
     * Зарегистрируем экземпляр текущего пользователя системы:
     * <pre>
     *    var currentUser = new Model();
     *    di.register('app.user', currentUser, {instantiate: false});
     * </pre>
     * Зарегистрируем логер, который будет singleton:
     * <pre>
     *    define(['Core/core-extend'], function(CoreExtend) {
     *       var Logger = CoreExtend.extend({
     *          log: function() {}
     *       });
     *       di.register('app.logger', Logger, {single: true});
     *    });
     * </pre>
     * Зарегистрируем модель пользователя с переопределенными аргументами конструктора:
     * <pre>
     *    define(['Core/core-merge'], function(coreMerge) {
     *       di.register('model.crm-user', function(options) {
     *          return new User(coreMerge(options, {
     *             context: 'crm',
     *             dateFormat: 'Y/m/d'
     *          }));
     *       });
     *    });
     * </pre>
     */
    function register(alias, factory, options) {
        checkAlias(alias);
        map[alias] = [
            factory,
            options
        ];
    }
    exports.register = register;    /**
     * Удаляет регистрацию зависимости
     * @param {String} alias Название зависимости
     * @example
     * <pre>
     *    di.unregister('model.user');
     * </pre>
     */
    /**
     * Удаляет регистрацию зависимости
     * @param {String} alias Название зависимости
     * @example
     * <pre>
     *    di.unregister('model.user');
     * </pre>
     */
    function unregister(alias) {
        checkAlias(alias);
        delete map[alias];
    }
    exports.unregister = unregister;    /**
     * Проверяет регистрацию зависимости
     * @param {String} alias Название зависимости
     * @return Boolean
     * @example
     * <pre>
     *    var userRegistered = di.isRegistered('model.user');
     * </pre>
     */
    /**
     * Проверяет регистрацию зависимости
     * @param {String} alias Название зависимости
     * @return Boolean
     * @example
     * <pre>
     *    var userRegistered = di.isRegistered('model.user');
     * </pre>
     */
    function isRegistered(alias) {
        checkAlias(alias);
        return map.hasOwnProperty(alias);
    }
    exports.isRegistered = isRegistered;    /**
     * Создает экземпляр зарегистрированной зависимости.
     * @param {String|Function|Object} alias Название зависимости, или конструктор объекта или инстанс объекта
     * @param {Object} [options] Опции конструктора
     * @return Object
     * @example
     * <pre>
     *    var User = Model.extend();
     *    di.register('model.$user', User, {instantiate: false});
     *    //...
     *    var newUser = di.create('model.$user', {
     *       rawData: {}
     *    });
     * </pre>
     */
    /**
     * Создает экземпляр зарегистрированной зависимости.
     * @param {String|Function|Object} alias Название зависимости, или конструктор объекта или инстанс объекта
     * @param {Object} [options] Опции конструктора
     * @return Object
     * @example
     * <pre>
     *    var User = Model.extend();
     *    di.register('model.$user', User, {instantiate: false});
     *    //...
     *    var newUser = di.create('model.$user', {
     *       rawData: {}
     *    });
     * </pre>
     */
    function create(alias, options) {
        var result = resolve(alias, options);
        if (typeof result === 'function') {
            return resolve(result, options);
        }
        return result;
    }
    exports.create = create;    /**
     * Разрешает зависимость
     * @param {String|Function|Object} alias Название зависимости, или конструктор объекта или инстанс объекта
     * @param {Object} [options] Опции конструктора
     * @return {Object|Function}
     * @example
     * <pre>
     *    var User = Model.extend();
     *    di.register('model.$user', User, {instantiate: false});
     *    di.register('model.user', User);
     *    //...
     *    var User = di.resolve('model.$user'),
     *       newUser = new User({
     *       rawData: {}
     *    });
     *    //...or...
     *    var newUser = di.resolve('model.user', {
     *       rawData: {}
     *    });
     * </pre>
     */
    /**
     * Разрешает зависимость
     * @param {String|Function|Object} alias Название зависимости, или конструктор объекта или инстанс объекта
     * @param {Object} [options] Опции конструктора
     * @return {Object|Function}
     * @example
     * <pre>
     *    var User = Model.extend();
     *    di.register('model.$user', User, {instantiate: false});
     *    di.register('model.user', User);
     *    //...
     *    var User = di.resolve('model.$user'),
     *       newUser = new User({
     *       rawData: {}
     *    });
     *    //...or...
     *    var newUser = di.resolve('model.user', {
     *       rawData: {}
     *    });
     * </pre>
     */
    function resolve(alias, options) {
        var aliasType = typeof alias, Factory, config, singleInst;
        switch (aliasType) {
        case 'function':
            Factory = alias;
            break;
        case 'object':
            Factory = alias;
            config = { instantiate: false };
            break;
        default:
            if (!isRegistered(alias)) {
                throw new ReferenceError('Alias "' + alias + '" does not registered');
            }
            Factory = map[alias][0];
            config = map[alias][1];
            singleInst = map[alias][2];
        }
        if (config) {
            if (config.instantiate === false) {
                return Factory;
            }
            if (config.single === true) {
                if (singleInst === undefined) {
                    singleInst = map[alias][2] = new Factory(options);
                }
                return singleInst;
            }
        }
        return new Factory(options);
    }
    exports.resolve = resolve;
});