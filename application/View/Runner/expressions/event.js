define('View/Runner/expressions/event', [
   'View/Executor/Expressions',
   'Core/IoC'
], function(Expressions, IoC) {
   IoC.resolve('ILogger').warn(
      'View/Executor/Expressions',
      '"View/Runner/expressions/event" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/Expressions" and use Expressions.Event from it instead.'
   );
   return Expressions.Event;
});
