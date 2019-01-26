define('View/Runner/expressions/scope', [
   'View/Executor/Expressions',
   'Core/IoC'
], function(Expressions, IoC) {
   IoC.resolve('ILogger').warn(
      'View/Executor/Expressions',
      '"View/Runner/expressions/scope" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/Expressions" and use Expressions.Scope from it instead.'
   );
   return Expressions.Scope;
});
