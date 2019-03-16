/// <amd-module name="Core/cookie" />
//@ts-ignore
import { cookie, IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Core/cookie", 'module has been moved to "Env/Env:cookie" and will be removed');

export = cookie;
