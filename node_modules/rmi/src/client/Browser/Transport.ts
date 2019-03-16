/// <amd-module name="Browser/Transport" />
import * as fetch from 'Browser/_Transport/fetch';
import * as URL from 'Browser/_Transport/URL';
import * as RPC from 'Browser/_Transport/RPC';
// @ts-ignore
import * as ajax from 'Browser/_Transport/ajax-emulator';

export { fetch, RPC, URL, ajax }
export { default as ITransport } from 'Browser/_Transport/ITransport'
export { default as RPCJSON } from 'Browser/_Transport/RPCJSON'
export { default as XHR } from 'Browser/_Transport/XHR'
