/// <amd-module name="Browser/_Transport/URL/getQueryParam" />
function _parseString(string, regExp) {
   var match = regExp.exec(string);
   return match && decodeURI(match[1]);
}

export default function(name) {
   var
       // @ts-ignore
       req = typeof process !== 'undefined' && process.domain && process.domain.req,
       regExp = new RegExp('[?&]' + name + '=([^&]*)');
   return (req && req.query) ?
       req.query[name] :
       (typeof location !== 'undefined' ?
           _parseString(location.search, regExp) :
           ''
       );
};
