/**
 * Created by ich.mardanshin on 14.09.2017.
 * Создан, так как сервер представлений не может находить html файлы
 */
// @ts-ignore
define('Lib/ServerEvent/StompTest/StompTest',
   [
      'Lib/Control/CompoundControl/CompoundControl',
      'tmpl!Lib/ServerEvent/StompTest/StompTest'
   ],
   function (CompoundControl, dotTplFn) {
      var moduleClass = CompoundControl.extend({
         _dotTplFn: dotTplFn
      });
      return moduleClass;
   });
