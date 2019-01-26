/// <amd-module name='View/_Request/Storage' />
import {
    IStorage
} from 'View/_Request/interface'
import CookieStorage from 'View/_Request/_Storage/Cookie'
import {
    default as NativeStorage,
    StorageType
} from 'View/_Request/_Storage/Native'
import ObjectStorage from 'View/_Request/_Storage/Object'

/**
 * Перечень доступных хранилищ "{@link Core/Request/IStorage}" внутри запроса
 * @name Core/Request/StorageKey
 * @typedef {Enum}
 * @property {String} sessionStorage
 * @property {String} localStorage
 * @property {String} userInfo
 * @property {String} cookie
 * @property {String} object
 */
export enum Key {
    sessionStorage = 'sessionStorage',
    localStorage = 'localStorage',
    userInfo = 'userInfo',
    cookie = 'cookie',
    object = 'object'
}

/**
 * Создаение экземпляра хранилища {@link Core/Request/IStorage}
 * @param {Core/Request/StorageKey} storage
 * @return {Core/Request/IStorage}
 */
export let create = (storage: Key): IStorage => {
    switch (storage){
        case Key.sessionStorage: {
            return new NativeStorage(StorageType.session);
        }
        case Key.localStorage: {
            return new NativeStorage(StorageType.local);
        }
        case Key.cookie: {
            return new CookieStorage();
        }
        default: {
            return new ObjectStorage();
        }
    }
};