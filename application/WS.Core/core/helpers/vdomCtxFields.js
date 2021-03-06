define('Core/helpers/vdomCtxFields', [
   'View/Executor/Utils',
   'Env/Env',
   'optional!Controls/Container/Scroll/Context',
   'optional!Controls/Context/TouchContextField',
   'optional!UserActivity/ActivityContextField'
], function(
   Utils,
   Env,
   ScrollData,
   TouchContextField,
   ActivityContextField) {

   /**
    * Модуль, содержащий все VDOM контексты с новых страниц, построенных на VDOM.
    * Необходим для внедрения новых компонентов, использующих новые контексты, в старые страницы.
    */

   return function() {
      if (!Utils.Common.isCompat()) {
         return {};
      }
      var
         hash = {},
         userInfo = window ? window.userInfo : process && process.domain && process.domain.req && process.domain.req.userInfo;

      if (ScrollData) {
         hash.ScrollData = new ScrollData({pagingVisible: false});
      }
      if (TouchContextField) {
         hash.isTouch = new TouchContextField(Env.compatibility.touch);
      }
      if (ActivityContextField) {
         hash.activityContextField = new ActivityContextField();
      }

      return hash;
   };
});
