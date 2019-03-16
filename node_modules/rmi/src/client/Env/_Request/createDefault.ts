/// <amd-module name='Env/_Request/createDefault' />
import { Console, LogLevel } from 'Env/_Request/Console';
import StateReceiver from 'Env/_Request/StateReceiver';
// @ts-ignore
import constants = require('Core/constants');
import { Key as StorageKey, create as createStorage } from 'Env/_Request/Storage';
import { IRequestConstructor, IRequest, ILocation, RequestConfig } from 'Env/_Request/interface';

declare const process;
declare const require;

const global = ((() => this || (0, eval)('this'))());

const getRequest = () => process && process.domain && process.domain.req || {};

const getForBrowser = (): RequestConfig => {
    const console = new Console({
        console: global.console,
        // @ts-ignore
        logLevel: <LogLevel>constants.logLevel
    });
    return {
        console,
        location: global.location,
        stateReceiver: new StateReceiver({ console }),
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
    let NodeCookie;
    try {
        NodeCookie = require('Env/_Request/_Storage/NodeCookie');
    } catch (e) {
        // сервеный JS
        NodeCookie = null;
    }
    let console = new Console({
        console: 'jstestdriver' in global ?
            global.jstestdriver.console :
            global.console,
        logLevel: <LogLevel>constants.logLevel
    });
    return {
        console,
        location: extractLocationFromNodeRequest(getRequest()),
        stateReceiver: new StateReceiver({
            console
        }),
        storageMap: {
            [StorageKey.cookie]: NodeCookie ? new NodeCookie.default() : createStorage(StorageKey.object)
        }
    }
};

/**
 *
 * @param {Env/IRequestConstructor} RequestConstructor
 * @return {IRequest}
 */
const create = (RequestConstructor: IRequestConstructor): IRequest => {
    let requestConfig: RequestConfig;
    if (constants.isBrowserPlatform) {
        requestConfig = getForBrowser();
    } else {
        requestConfig = getForNode();
    }
    return new RequestConstructor(requestConfig);
};
// tslint:disable-next-line
export default create;
