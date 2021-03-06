define('View/Runner/config/resolver', [
   'View/Executor/Utils',
   'Env/Env'
], function(Utils, Env) {
   Env.IoC.resolve('ILogger').warn(
      'View/Executor/Utils',
      '"View/Runner/config/resolver" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/Utils" and use Utils.ConfigResolver from it instead.'
   );
   return Utils.ConfigResolver;
});
