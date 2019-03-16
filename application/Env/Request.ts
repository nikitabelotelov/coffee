/// <amd-module name="Env/Request" />
import createDefault from 'Env/_Request/createDefault'
import {
    Key as StorageKey,
    create as createStorage
} from 'Env/_Request/Storage';
import {
    IConsole,
    IStorage,
    ILocation,
    IStateReceiver,
    IRequest,
    RequestConfig,
    StorageMap
} from 'Env/_Request/interface';

let globalEnv = {};
let getEnv = () => {
    return process && process.domain && process.domain.req || window || globalEnv;
};

/**
 *
 * @class
 * @name IStateReceiver
 * @implements Env/IRequest
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
     * @name Env/Request#location
     * @type {Env/Request/ILocation}
     */
    location: ILocation;
    /**
     * @property
     * @name Env/Request#console
     * @type {Env/Request/IConsole}
     */
    console: IConsole;
    /**
     * @property
     * @name Env/Request#stateReceiver
     * @type {Env/Request/IStateReceiver}
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
     * @param {Env/Request/StorageKey} key Тип хранилища
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
     * @param {Env/IRequest} request
     * @static
     * @name Env/Request#setCurrent
     */
    static setCurrent(request: IRequest) {
        getEnv().wasabyRequest = request;
    }

    /**
     * @return {Env/IRequest}
     * @static
     * @name Env/Request#getCurrent
     */
    static getCurrent(request: IRequest) {
        return getEnv().wasabyRequest;
    }

    /**
     * @name Env/Request#StorageKey
     * @static
     * @type {Env/Request/StorageKey}
     */
    static StorageKey = StorageKey;
}

/*
 * Первичная инициализация
 */
CoreRequest.setCurrent(createDefault(CoreRequest));

export = CoreRequest;
