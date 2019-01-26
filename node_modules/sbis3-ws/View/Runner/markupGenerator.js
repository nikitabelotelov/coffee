define('View/Runner/markupGenerator', [
   'View/Executor/Markup',
   'Core/IoC'
], function(Markup, IoC) {
   IoC.resolve('ILogger').warn(
      'View/Executor/Markup',
      '"View/Runner/markupGenerator" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/Markup" and use Markup.Generator from it instead.'
   );
   return Markup.Generator;
});
