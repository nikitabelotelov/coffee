define('View/Runner/focusHelper', [
   'View/Executor/Expressions',
   'Core/IoC'
], function(Expressions, IoC) {
   IoC.resolve('ILogger').warn(
      'View/Executor/Expressions',
      '"View/Runner/focusHelper" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/Expressions" and use Expressions.Focus from it instead.'
   );
   return Expressions.Focus;
});
