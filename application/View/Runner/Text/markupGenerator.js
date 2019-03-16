define('View/Runner/Text/markupGenerator', [
   'View/Executor/Markup',
   'Env/Env'
], function(Markup, Env) {
   Env.IoC.resolve('ILogger').warn(
      'View/Executor/Markup',
      '"View/Runner/Text/markupGenerator" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/Markup" and use Markup.GeneratorText from it instead.'
   );
   return Markup.GeneratorText;
});
