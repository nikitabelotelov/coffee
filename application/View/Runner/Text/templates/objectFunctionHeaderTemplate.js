define('View/Runner/Text/templates/objectFunctionHeaderTemplate', [
   'View/Executor/Markup',
   'Core/IoC'
], function(Markup, IoC) {
   IoC.resolve('ILogger').warn(
      'View/Executor/Markup',
      '"View/Runner/Text/templates/objectFunctionHeaderTemplate" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/Markup" and use Markup.FunctionHeaderTemplate from it instead.'
   );
   return Markup.FunctionHeaderTemplate;
});
