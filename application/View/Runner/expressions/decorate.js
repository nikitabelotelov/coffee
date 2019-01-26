define('View/Runner/expressions/decorate', [
   'View/Executor/Expressions',
   'Core/IoC'
], function(Expressions, IoC) {
   IoC.resolve('ILogger').warn(
      'View/Executor/Expressions',
      '"View/Runner/expressions/decorate" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/Expressions" and use Expressions.Decorate from it instead.'
   );
   return Expressions.Decorate;
});