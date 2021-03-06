define('View/Runner/Vdom/utils/optionsResolver', [
   'View/Executor/Utils',
   'Env/Env'
], function(Utils, Env) {
   Env.IoC.resolve('ILogger').warn(
      'View/Executor/Utils',
      '"View/Runner/Vdom/utils/optionsResolver" wrapper is deprecated and will be removed. ' +
      'Require "View/Executor/Utils" and use Utils.OptionsResolver from it instead.'
   );
   return Utils.OptionsResolver;
});
