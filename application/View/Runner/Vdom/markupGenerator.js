define('View/Runner/Vdom/markupGenerator', [
   'View/Executor/Markup',
   'Env/Env'
], function(Markup, Env) {
   Env.IoC.resolve('ILogger').warn(
      'View/Executor/Markup',
      '"View/Runner/Vdom/markupGenerator" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/Markup" and use Markup.GeneratorVdom from it instead.'
   );
   return Markup.GeneratorVdom;
});
