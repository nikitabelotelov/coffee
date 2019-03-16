/// <amd-module name="Env/_Env/IoC" />
/**
 * IoC контейнер
 * Эта штука позволяет нам конфигурировать, какая конкретная реализация соответствует заданному интерфейсу.
 * Все как во взрослых языках, ога.
 * Это используется например для:
 *    - конфигурирования какой транспорт использовать;
 *    - конфигурирования system-wide логгера.
 *
 * <pre>
 *    ioc.bind('ITransport', 'XHRPostTransport');
 *    ioc.bindSingle('ILogger', 'ConsoleLogger', { ...config...});
 *    ...
 *    ioc.resolve('ITransport', config);
 *    ioc.resolve('ILogger');
 * </pre>
 *
 * @class Env/IoC
 * @author Бегунов А.В.
 * @public
 * @singleton
 */
let map = {};
let singletons = {};

function resolveAsFunction(func, config) {
    let result;
    if (func instanceof Function && func.prototype && func.prototype.$constructor) {
        result = new func(config);
    } else {
        result = func(config);
    }
    
    return result;
}
export default /** @lends Env/IoC.prototype */ {
    /**
     * Привязывает реализацию к интерфейсу.
     *
     * @param {String} interfaceName
     * @param {String|Function} implementationName Имя реализации или функция-резолвер возвращающая экземпляр
     */
    bind(interfaceName, implementationName) {
        map[interfaceName] = {
            implementation: implementationName,
            isSingle: 0
        };
    },
    
    /**
     * Привязывает единственный экземпляр реализации к указанному "интерфейсу"
     *
     * @param {String} interfaceName
     * @param {String} implementationName
     * @param {Object} [config]
     */
    bindSingle(interfaceName, implementationName?, config?) {
        map[interfaceName] = {
            implementation: implementationName,
            isSingle: 1,
            config: config || {}
        };
        singletons[interfaceName] = '';
    },
    
    /**
     * @param {String} interfaceName
     * @param {Object} [config]
     * @returns {Object}
     * @throws TypeError
     * @throws ReferenceError
     */
    resolve(interfaceName, config?) {
        if (interfaceName in map) {
            let
                binding = map[interfaceName],
                classConstructorName = binding.implementation,
                isSingleton = binding.isSingle,
                implementation;
            if (isSingleton && singletons[interfaceName]) {
                return singletons[interfaceName];
            }
            
            // resolver mode
            
            if (typeof classConstructorName === 'function') {
                implementation = classConstructorName;
            }
            
            /* else {
   
                console.error('Module:' + interfaceName + '   Constructor' + map[interfaceName].implementation);
                throw new ReferenceError("No mappings defined forrrrrr " + interfaceName);
            } */
            
            if (implementation) {
                if (isSingleton) {
                    return singletons[interfaceName] = resolveAsFunction(implementation, binding.config);
                }
                return resolveAsFunction(implementation, config);
            }
            return binding.implementation;
        }
        throw new ReferenceError(`No mappings defined for ${interfaceName}`);
    },
    has(interfaceName) {
        return interfaceName in map;
    }
};
