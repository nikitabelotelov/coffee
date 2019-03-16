/// <amd-module name="Transport/attachTemplate" />
//@ts-ignore
import { attachTemplate } from 'Browser/TransportOld';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/getRpcInvocationUrl", 'module has been moved to "Browser/TransportOld:attachTemplate" and will be removed');

export = attachTemplate;
