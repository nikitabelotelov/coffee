/// <amd-module name='View/_Request/createDefault' />
import { Console } from 'View/_Request/Console';
import StateReceiver from 'View/_Request/StateReceiver';
//@ts-ignore
import { constants } from 'Env/Env';

import {
    Key as StorageKey,
    create as createStorage
} from 'View/_Request/Storage';
import {
    IRequestConstructor,
    IRequest,
    ILocation,
    RequestConfig
} from "View/_Request/interface";
import NodeCookie from 'View/_Request/_Storage/NodeCookie';
declare let process, require;

const global = (function () { return this || (0, eval)('this'); }());

let getRequest = () => {
    return process && process.domain && process.domain.req || {}
};

let getForBrowser = (): RequestConfig => {
    let console = new Console({
        console: global.console,
        logLevel: constants.logLevel
    });
    return {
        console,
        location: global.location,
        stateReceiver: new StateReceiver({
            console
        }),
        storageMap: {
            [StorageKey.cookie]: createStorage(StorageKey.cookie),
            [StorageKey.sessionStorage]: createStorage(StorageKey.sessionStorage),
            [StorageKey.localStorage]: createStorage(StorageKey.localStorage),
        }
    }
};

function extractLocationFromNodeRequest(req: any): ILocation {
    const href: string = req.originalUrl || '';

    const searchIndex = href.indexOf('?');
    const search = searchIndex >= 0 ? href.slice(searchIndex) : '';

    // Extracts fields required for location from Presentation Service's
    // express-like request object
    return {
        protocol: req.protocol || '',
        host: req.hostname || '',
        hostname: req.hostname || '',
        port: '',
        hash: '', // hash is not sent to the server
        href,
        pathname: req.path || '',
        search
    };
}

let getForNode = (): RequestConfig => {
    let console = new Console({
        console: 'jstestdriver' in global ?
            global.jstestdriver.console :
            global.console,
        logLevel: constants.logLevel
    });
    return {
        console,
        location: extractLocationFromNodeRequest(getRequest()),
        stateReceiver: new StateReceiver({
            console
        }),
        storageMap: {
            [StorageKey.cookie]: NodeCookie ? new NodeCookie() : createStorage(StorageKey.object)
        }
    }
};

/**
 *
 * @param {Core/IRequestConstructor} RequestConstructor
 * @return {IRequest}
 */
let create = (RequestConstructor: IRequestConstructor): IRequest => {
    let requestConfig: RequestConfig;
    if (constants.isBrowserPlatform) {
        requestConfig = getForBrowser();
    } else {
        requestConfig = getForNode();
    }
    return new RequestConstructor(requestConfig);
};

export default create;
