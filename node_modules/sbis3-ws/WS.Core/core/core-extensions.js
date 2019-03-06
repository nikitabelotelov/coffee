define('Core/core-extensions', [
   'Env/Env',
   'Core/Deferred',
   'Core/ParallelDeferred',
   'Core/RightsManager',
   'Core/ExtensionsManager',
   'View/Executor/Markup',
   'is!browser?Core/ContextField/Flags',
   'is!browser?Core/ContextField/Record',
   'is!browser?Core/ContextField/Enum',
   'is!browser?Core/ContextField/List'
], function(
   Env,
   Deferred,
   ParallelDeferred,
   RightsManager,
   ExtensionsManager
) {
   var resultDef = new ParallelDeferred( {stopOnFirstError:false, maxRunningCount:1 });

   if (!ExtensionsManager.extensionsLoaded()) {
      resultDef.push(ExtensionsManager.loadExtensions());
   }

   if (Env.constants.rights) {
      var rights = RightsManager.getRights();
      if (rights instanceof Deferred) {
         resultDef.push(rights.addCallback(function (rights) {
            window.rights = rights;
         }));
      }
   }

   return resultDef.done().getResult();
});
