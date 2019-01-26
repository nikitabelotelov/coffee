define('View/Runner/tclosure', [
   'View/Executor/TClosure',
   'Core/IoC'
], function(TClosure, IoC) {
   IoC.resolve('ILogger').warn(
      'View/Executor/TClosure',
      '"View/Runner/tclosure" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/TClosure" and use it instead.'
   );
   return TClosure;
});
