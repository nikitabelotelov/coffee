define('View/Runner/requireHelper', [
   'View/Executor/Utils',
   'Env/Env'
], function(Utils, Env) {
   Env.IoC.resolve('ILogger').warn(
      'View/Executor/Utils',
      '"View/Runner/requireHelper" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/Utils" and use Utils.RequireHelper from it instead.'
   );
   return Utils.RequireHelper;
});
