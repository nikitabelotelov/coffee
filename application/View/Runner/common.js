define('View/Runner/common', [
   'View/Executor/Utils',
   'Core/IoC'
], function(Utils, IoC) {
   IoC.resolve('ILogger').warn(
      'View/Executor/Utils',
      '"View/Runner/common" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/Utils" and use Utils.Common from it instead.'
   );
   return Utils.Common;
});
