define('View/Runner/expressions/attrHelper', [
   'View/Executor/Expressions',
   'Core/IoC'
], function(Expressions, IoC) {
   IoC.resolve('ILogger').warn(
      'View/Executor/Expressions',
      '"View/Runner/expressions/attrHelper" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/Expressions" and use Expressions.AttrHelper from it instead.'
   );
   return Expressions.AttrHelper;
});
