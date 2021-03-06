/**
 * Created by dv.zuev on 12.07.2018.
 */
define('Core/helpers/VdomCtxPlugin', [
   'View/Executor/Utils',
   'Core/Control'
], function(
   Utils,
   Control
) {

   return function(getCtxData) {
      if (!Control.prototype._getOriginalChildContext && Control.prototype._getChildContext && !Control.prototype._getChildContext.patched) {
         Control.prototype._getOriginalChildContext = Control.prototype._getChildContext;
      }
      Control.prototype._getChildContext = function(){
         var resolvedCtx = {};
         if (Control.prototype._getOriginalChildContext) {
            resolvedCtx = Control.prototype._getOriginalChildContext();
         }

         /*Если мы работаем без слоя совместимости, значит этот запрос обрабатывается для чистого vdom
         * в читстом vdom контексты распространяются корретно
         * В этот кусок кода мы попали, потому что на этом же инстансе строили старые страницы
         * и прототип контрола пропатчен данными*/
         var ctxData = Utils.Common.isCompat() ? getCtxData() : {};
         for(var i in ctxData) {
            if (ctxData.hasOwnProperty(i)) {
               resolvedCtx[i] = ctxData[i];
            }
         }

         return resolvedCtx;
      };

      Control.prototype._getChildContext.patched = true;
   };

});
