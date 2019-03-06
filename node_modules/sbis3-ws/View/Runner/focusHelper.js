define('View/Runner/focusHelper', [
   'View/Executor/Expressions',
   'Env/Env'
], function(Expressions, Env) {
   Env.IoC.resolve('ILogger').warn(
      'View/Executor/Expressions',
      '"View/Runner/focusHelper" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/Expressions" and use Expressions.Focus from it instead.'
   );
   return Expressions.Focus;
});
