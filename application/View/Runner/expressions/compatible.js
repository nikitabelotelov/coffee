define('View/Runner/expressions/compatible', [
   'View/Executor/Utils',
   'Env/Env'
], function(Utils, Env) {
   Env.IoC.resolve('ILogger').warn(
      'View/Executor/Utils',
      '"View/Runner/expressions/compatible" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/Utils" and use Utils.Compatible from it instead.'
   );
   return Utils.Compatible;
});