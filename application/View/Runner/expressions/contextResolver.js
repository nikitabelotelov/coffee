define('View/Runner/expressions/contextResolver', [
   'View/Executor/Expressions',
   'Env/Env'
], function(Expressions, Env) {
   Env.IoC.resolve('ILogger').warn(
      'View/Executor/Expressions',
      '"View/Runner/expressions/contextResolver" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/Expressions" and use Expressions.ContextResolver from it instead.'
   );
   return Expressions.ContextResolver;
});