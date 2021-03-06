define('View/Builder/Tmpl/modules/utils/requireType', [
   'require',
   'View/Builder/Tmpl/modules/utils/names',
   'View/Builder/Tmpl/modules/utils/nodes',
   'View/Builder/Tmpl/modules/utils/common',
   'Core/Deferred',
   'View/Executor/Utils'
], function requireFileAMDCall(
   require,
   names,
   nodes,
   common,
   Deferred,
   Utils
) {
   'use strict';
   var global =  (function() {
      return this || (0, eval)('this');
   })();

   function wsControlResolver(url) {
      if (url.indexOf("Controls/")===0){
         /*Например в SBIS3.CONTROLS сделаны псевдонимы, либо костыли там, либо тут */
         return url;
      } else {
         return 'js!' + url;
      }
   }
   function findRequireCallback(url) {
      return names.isControlString(url.split('optional!')[1])
         ? requireWsControlFile.call(this, url) : requireTemplateFile.call(this, url);
   }
   function requireTemplateFile(url) {
      var def = new Deferred(),
         resolver = common.hasResolver(url, this.config && this.config.resolvers),
         templateFn;
      /**
       * Если есть resolver, то просто формируем Template Node с таким именем
       */
      if (resolver) {
         def.callback(nodes.createTemplateNode(url));
      } else {
         if (this.fromBuilderTmpl){
            def.callback(nodes.createTemplateNode(url));
         } else if (Utils.RequireHelper.defined(url)) {
            templateFn = require(url);
            def.callback(nodes.createTemplateNode(url, undefined, templateFn === null));
         } else {
            require([url], function requireAmdFileHandler(control) {
                  var cnull = (control === null);
                  if (control || cnull) {
                     def.callback(nodes.createTemplateNode(url, undefined, undefined, cnull));
                  } else {
                     def.errback(new Error("Wrong including " + url));
                  }
               }, function requireAmdFile(reason) {
                  def.errback(new Error("Wrong including " + url));
               }
            );
         }
      }
      return def;
   }
   function requireAmdFile(url) {
      var def = new Deferred();

      if (this.fromBuilderTmpl){
         def.callback(nodes.createControlNode(url));
      } else {
         require([url], function requireAmdFileHandler(prep) {
               if (prep) {
                  def.callback(nodes.createControlNode(url));
               } else {
                  def.errback(new Error("Wrong including " + url));
               }
            }, function requireAmdFile(reason) {
               def.errback(reason);
            }
         );
      }
      return def;
   }
   function requireWsControlFile(url) {
      var def = new Deferred(),
         control;
      if (this.fromBuilderTmpl){
         def.callback(nodes.createControlNode(url, undefined, url));
      } else if (Utils.RequireHelper.defined(url)) {
         control = require(url);
         def.callback(nodes.createControlNode(url, undefined, url, control === null));
      } else {
         require([url], function requireAmdFileHandler(control) {
            var cnull = (control === null);
               if (control || cnull) {
                  def.callback(nodes.createControlNode(url, undefined, url, cnull));
               } else {
                  def.errback( new Error("Wrong including " + url) );
               }
            }, function requireAmdFile(reason) {
               def.errback(reason);
            }
         );
      }
      return def;
   }
   function requireWsModule(fullName, libPath) {
      var def = new Deferred();
      if (this.fromBuilderTmpl || Utils.RequireHelper.defined(libPath.library)) {
         def.callback(nodes.createModuleNode(libPath, undefined, fullName));
      } else {
         require([libPath.library], function requireAmdFileHandler(library) {
            if (library || library === null) {
               def.callback(nodes.createModuleNode(libPath, undefined, fullName));
            } else {
               def.errback(new Error('Wrong including ' + url));
            }
         }, function requireAmdFile(reason) {
            def.errback(reason);
         });
      }
      return def;
   }
   return function requireFile(url) {
      if (url.type === 'ws-control') {
         if (url.simple) {
            return requireWsControlFile.call(this, url.value);
         }
         return requireWsControlFile.call(this, wsControlResolver(url.value));
      } else if (url.type === 'optional') {
         return findRequireCallback.call(this, url.value);
      } else if (url.type === 'template') {
         return requireTemplateFile.call(this, url.value);
      } else if (url.type === 'ws-module') {
         return requireWsModule.call(this, url.value, url.libPath);
      } else {
         return requireAmdFile.call(this, this.resolver(url.value));
      }
   };
});
