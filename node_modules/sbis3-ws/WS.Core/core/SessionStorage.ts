/// <amd-module name="Core/SessionStorage" />
//@ts-ignore
import { SessionStorage } from 'Browser/Storage';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Core/SessionStorage", 'module has been moved to "Browser/Storage:SessionStorage" and will be removed');

export = SessionStorage;
