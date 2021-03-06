/* eslint-disable */
/// <amd-module name="Env/_Request/_Storage/NodeCookie" />
import {IStorage} from "Env/_Request/Interface/IStorage";
declare let process;

let getRequest = () => {
    return process && process.domain && process.domain.req || {};
};

/**
 * Класс, реализующий интерфейс {@link Core/Request/IStorage},
 * предназначенный для работы с cookie в серверном окружении
 * @class
 * @name Env/_Request/_Storage/Cookie
 * @implements Core/Request/IStorage
 * @author Заляев А.В
 */
class NodeCookie implements IStorage {
    get(key: string) {
        const request = getRequest();
        return request.cookies ? request.cookies[key] : null;
    }
    set(key: string, value: string, options?) {
        // todo log
        // throw new Error('Set cookie on server is not supported');
        return false;
    }
    remove(key: string): void {
        this.set(key, null);
    }
    getKeys(): Array<string> {
        return Object.keys(getRequest().cookies || {})
    }
    toObject(): HashMap<string> {
        return {
            ...getRequest().cookies
        };
    }
}
// tslint:disable-next-line
export default NodeCookie;
