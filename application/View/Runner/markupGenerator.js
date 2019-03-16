define('View/Runner/markupGenerator', [
   'View/Executor/Markup',
   'Env/Env'
], function(Markup, Env) {
   Env.IoC.resolve('ILogger').warn(
      'View/Executor/Markup',
      '"View/Runner/markupGenerator" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/Markup" and use Markup.Generator from it instead.'
   );
   return Markup.Generator;
});
