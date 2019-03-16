define('View/Runner/expressions/attr', [
   'View/Executor/Expressions',
   'Env/Env'
], function(Expressions, Env) {
   Env.IoC.resolve('ILogger').warn(
      'View/Executor/Expressions',
      '"View/Runner/expressions/attr" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/Expressions" and use Expressions.Attr from it instead.'
   );
   return Expressions.Attr;
});
