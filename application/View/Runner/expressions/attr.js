define('View/Runner/expressions/attr', [
   'View/Executor/Expressions',
   'Core/IoC'
], function(Expressions, IoC) {
   IoC.resolve('ILogger').warn(
      'View/Executor/Expressions',
      '"View/Runner/expressions/attr" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/Expressions" and use Expressions.Attr from it instead.'
   );
   return Expressions.Attr;
});
