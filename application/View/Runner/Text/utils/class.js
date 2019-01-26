define('View/Runner/Text/utils/class', [
   'View/Executor/Utils',
   'Core/IoC'
], function(Utils, IoC) {
   IoC.resolve('ILogger').warn(
      'View/Executor/Utils',
      '"View/Runner/Text/utils/class" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/Utils" and use Utils.Class from it instead.'
   );
   return Utils.Class;
});
