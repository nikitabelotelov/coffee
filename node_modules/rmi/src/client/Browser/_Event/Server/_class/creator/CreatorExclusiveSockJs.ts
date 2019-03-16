/// <amd-module name="Browser/_Event/Server/_class/creator/CreatorExclusiveSockJs" />
import { ConnectOptions } from "Browser/_Event/Server/_class/ConnectOptions";
import { CreatorExclusive } from "Browser/_Event/Server/_class/creator/CreatorExclusive";
import { TransportConnect } from "Browser/_Event/Server/_class/creator/TransportConnect";

export class CreatorExclusiveSockJs extends CreatorExclusive {
    constructor(connectOptions: ConnectOptions) {
        const USE_SOCK_JS = true;
        super(connectOptions, new TransportConnect(USE_SOCK_JS));
    }
}
