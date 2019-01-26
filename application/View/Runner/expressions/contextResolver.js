define('View/Runner/expressions/contextResolver', [
   'View/Executor/Expressions',
   'Core/IoC'
], function(Expressions, IoC) {
   IoC.resolve('ILogger').warn(
      'View/Executor/Expressions',
      '"View/Runner/expressions/contextResolver" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/Expressions" and use Expressions.ContextResolver from it instead.'
   );
   return Expressions.ContextResolver;
});