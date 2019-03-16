/// <amd-module name="Core/load-contents" />
//@ts-ignore
import { loadContents, IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Core/load-contents", 'module has been moved to "Env/Env:loadContents" and will be removed');

export = loadContents;
