/// <amd-module name="Browser/_Transport/URL/getHostName" />
export default function() {
    // @ts-ignore
    var req = process && process.domain && process.domain.req;
    return req ? req.hostname : location.hostname;
};
