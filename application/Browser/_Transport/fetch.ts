/// <amd-module name="Browser/_Transport/fetch" />
import * as Errors from 'Browser/_Transport/fetch/Errors';
import fetch from 'Browser/_Transport/fetch/fetch';

export { Errors, fetch }
export { RESPONSE_TYPE, parse as responseParser } from 'Browser/_Transport/fetch/responseParser';
export { AbortPromise, FetchConfig, FetchTransport, HttpMethod } from 'Browser/_Transport/fetch/interface';
export default fetch;
