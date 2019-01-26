define('View/Runner/expressions/subscriber', [
   'View/Executor/Expressions',
   'Core/IoC'
], function(Expressions, IoC) {
   IoC.resolve('ILogger').warn(
      'View/Executor/Expressions',
      '"View/Runner/expressions/subscriber" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/Expressions" and use Expressions.Subscriber from it instead.'
   );
   return Expressions.Subscriber;
});
