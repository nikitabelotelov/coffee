/// <amd-module name="Core/helpers/Number/randomId" />
export = function(prefix) {
   return (prefix || 'ws-') + Math.random().toString(36).substr(2) + (+new Date());
}
