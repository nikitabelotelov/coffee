/// <amd-module name="Browser/_Event/Server/_class/creator/CreatorSockJs" />
import { ConnectOptions } from "Browser/_Event/Server/_class/ConnectOptions";
import { CreatorWebSocket } from "Browser/_Event/Server/_class/creator/CreatorWebSocket";
import { TransportConnect } from "Browser/_Event/Server/_class/creator/TransportConnect";

export class CreatorSockJs extends CreatorWebSocket {
    constructor(connectOptions: ConnectOptions) {
        const USE_SOCK_JS = true;
        super(connectOptions, new TransportConnect(USE_SOCK_JS));
    }
}
