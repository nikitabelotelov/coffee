define('View/Runner/expressions/rights', [
   'View/Executor/Expressions',
   'Core/IoC'
], function(Expressions, IoC) {
   IoC.resolve('ILogger').warn(
      'View/Executor/Expressions',
      '"View/Runner/expressions/rights" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/Expressions" and use Expressions.Rights from it instead.'
   );
   return Expressions.Rights;
});
