/// <amd-module name="Transport/ReportPrinter" />
//@ts-ignore
import { ReportPrinter } from 'Browser/TransportOld';
//@ts-ignore
import { IoC } from 'Env/Env';
IoC.resolve('ILogger').log("Transport/getRpcInvocationUrl", 'module has been moved to "Browser/TransportOld:ReportPrinter" and will be removed');

export = ReportPrinter;
