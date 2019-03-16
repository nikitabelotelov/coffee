/// <amd-module name="Lib/ServerEvent/Bus" />
//@ts-ignore
import { Server } from 'Browser/Event';
//@ts-ignore
import { IoC } from 'Env/Env';

IoC.resolve('ILogger').log("Lib/ServerEvent/Bus", 'module has been moved to "Browser/Event:Server" and will be removed');

export = Server;
