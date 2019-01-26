define('View/Runner/Text/markupGeneratorCompatible', [
   'View/Executor/GeneratorCompatible',
   'Core/IoC'
], function(GeneratorCompatible, IoC) {
   IoC.resolve('ILogger').warn(
      'View/Executor/GeneratorCompatible',
      '"View/Runner/Text/markupGeneratorCompatible" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/GeneratorCompatible" and use it instead.'
   );
   return GeneratorCompatible;
});
