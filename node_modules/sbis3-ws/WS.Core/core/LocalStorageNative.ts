/// <amd-module name="Core/LocalStorageNative" />
//@ts-ignore
import { LocalStorageNative } from 'Browser/Storage';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Core/LocalStorageNative", 'module has been moved to "Browser/Storage:LocalStorageNative" and will be removed');

export = LocalStorageNative;
