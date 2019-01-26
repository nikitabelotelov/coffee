define('View/Runner/vdomutils', [
   'View/Executor/Utils',
   'Core/IoC'
], function(Utils, IoC) {
   IoC.resolve('ILogger').warn(
      'View/Executor/Utils',
      '"View/Runner/vdomutils" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/Utils" and use Markup.Vdom from it instead.'
   );
   return Utils.Vdom;
});
