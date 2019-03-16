define('View/Runner/expressions/RawMarkupNode', [
   'View/Executor/Expressions',
   'Env/Env'
], function(Expressions, Env) {
   Env.IoC.resolve('ILogger').warn(
      'View/Executor/Expressions',
      '"View/Runner/expressions/RawMarkupNode" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/Expressions" and use Expressions.RawMarkupNode from it instead.'
   );
   return Expressions.RawMarkupNode;
});
