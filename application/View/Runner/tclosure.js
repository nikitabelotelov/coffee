define('View/Runner/tclosure', [
   'View/Executor/TClosure',
   'Env/Env'
], function(TClosure, Env) {
   Env.IoC.resolve('ILogger').warn(
      'View/Executor/TClosure',
      '"View/Runner/tclosure" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/TClosure" and use it instead.'
   );
   return TClosure;
});
