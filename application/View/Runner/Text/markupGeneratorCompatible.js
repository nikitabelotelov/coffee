define('View/Runner/Text/markupGeneratorCompatible', [
   'View/Executor/GeneratorCompatible',
   'Env/Env'
], function(GeneratorCompatible, Env) {
   Env.IoC.resolve('ILogger').warn(
      'View/Executor/GeneratorCompatible',
      '"View/Runner/Text/markupGeneratorCompatible" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/GeneratorCompatible" and use it instead.'
   );
   return GeneratorCompatible;
});
