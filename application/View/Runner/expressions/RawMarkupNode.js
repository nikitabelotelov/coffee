define('View/Runner/expressions/RawMarkupNode', [
   'View/Executor/Expressions',
   'Core/IoC'
], function(Expressions, IoC) {
   IoC.resolve('ILogger').warn(
      'View/Executor/Expressions',
      '"View/Runner/expressions/RawMarkupNode" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/Expressions" and use Expressions.RawMarkupNode from it instead.'
   );
   return Expressions.RawMarkupNode;
});
