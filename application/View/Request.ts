/// <amd-module name='View/Request' />
import createDefault from 'View/_Request/createDefault'
import {
    Key as StorageKey,
    create as createStorage
} from 'View/_Request/Storage';
import {
    IConsole,
    IStorage,
    ILocation,
    IStateReceiver,
    IRequest,
    RequestConfig,
    StorageMap
} from 'View/_Request/interface';

let globalEnv = {};
let getEnv = () => {
   return process && process.domain && process.domain.req || window || globalEnv;
};

/**
 *
 * @class
 * @name IStateReceiver
 * @implements Core/IRequest
 * @public
 * @author Заляев А.В
 * @see Core/Request/IStorage
 * @see Core/Request/ILocation
 * @see Core/Request/IConsole
 * @see Core/Request/ISerializableState
 * @see Core/Request/IStateReceiver
 * @example
 * <h2>Работа с singleton(в рамках одного потока/запроса) хранилищами</h2>
 * <pre>
 *     import CoreRequest = require('Core/Request');
 *     const LAST_ENTRANCE_KEY = 'debug';
 *
 *     let getCurrentRequest = () => CoreRequest.getCurrent();
 *     let getLocalStorage = () => getCurrentRequest().getStorage(CoreRequest.StorageKey.localStorage);
 *
 *     let lastEntrance = getLocalStorage().get(LAST_ENTRANCE_KEY);
 *     if (lastEntrance) {
 *         getCurrentRequest().console.log(`last visit was ${(lastEntrance - Date.now())/1000} second ago`)
 *     }
 *     getLocalStorage().set(LAST_ENTRANCE_KEY, Date.now());
 * </pre>
 * <h2>Сохранение состояния своего компонента при построении на сервере</h2>
 * <pre>
 *     import CoreRequest = require('Core/Request');
 *     import Page = require('MyService/Page'); // implements Core/Request/ISerializableState
 *
 *     let mainPage = new Page({
 *         // ...
 *     });
 *     CoreRequest.getCurrent().stateReceiver.register(mainPage.getUid(), mainPage);
 * </pre>
 */
class CoreRequest implements IRequest {
    /**
     * @property
     * @name Core/Request#location
     * @type {Core/Request/ILocation}
     */
    location: ILocation;
    /**
     * @property
     * @name Core/Request#console
     * @type {Core/Request/IConsole}
     */
    console: IConsole;
    /**
     * @property
     * @name Core/Request#stateReceiver
     * @type {Core/Request/IStateReceiver}
     */
    stateReceiver: IStateReceiver;
    private readonly __storageMap: StorageMap;
    constructor(config: RequestConfig) {
        let {
            stateReceiver,
            storageMap,
            console,
            location
        } = config;

        this.stateReceiver = stateReceiver;
        this.__storageMap = { ...storageMap };
        this.console = console;
        this.location = location;
    }

    /**
     * Получение хранилища для сохранений данных в рамках запроса.
     * @param {Core/Request/StorageKey} key Тип хранилища
     * @name IStateReceiver#getStorage
     */
    getStorage(key: StorageKey): IStorage {
        if (!this.__storageMap[key]) {
            this.__storageMap[key] = createStorage(StorageKey.object);
        }
        return this.__storageMap[key];
    }

    /// region Кандидат на удаление.
    // Нужно чтобы работать с Request без начальной точки входа
    setStorage(key: StorageKey, storage: IStorage) {
        if (this.__storageMap[key]) {
            throw new Error(`attempt to overwrite used storage "${key}"`);
        }
        this.__storageMap[key] = storage;
    }
    setConsole(console: IConsole) {
        this.console = console;
    }
    setLocation(location: ILocation) {
        this.location = location;
    }
    setStateReceiver(stateReceiver: IStateReceiver) {
        this.stateReceiver = stateReceiver;
    }
    /// endregion Кандидат на удаление.

    /**
     * @param {Core/IRequest} request
     * @static
     * @name Core/Request#setCurrent
     */
    static setCurrent(request: IRequest) {
        getEnv().wasabyRequest = request;
    }

    /**
     * @return {Core/IRequest}
     * @static
     * @name Core/Request#getCurrent
     */
    static getCurrent() {
        return getEnv().wasabyRequest;
    }

    /**
     * @name Core/Request#StorageKey
     * @static
     * @type {Core/Request/StorageKey}
     */
    static StorageKey = StorageKey;
}

/*
 * Первичная инициализация
 */
CoreRequest.setCurrent(createDefault(CoreRequest));

export = CoreRequest;
