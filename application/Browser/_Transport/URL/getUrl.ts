/// <amd-module name="Browser/_Transport/URL/getUrl" />
export default function() {
    // @ts-ignore
    var req = process && process.domain && process.domain.req;
    return req
        ? req.originalUrl
        : location
            ? location.href
            : '';
};
