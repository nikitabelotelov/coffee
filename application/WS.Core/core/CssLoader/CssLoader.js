define('Core/CssLoader/CssLoader', [
   'Core/IoC',
   'Core/core-extend',
   'Transport/XHRTransport'
], function(IoC, coreExtend) {
   'use strict';

   // Class that make requests for css-files

   var CssLoader = coreExtend.extend([], {
      linkResolver: null,
      constructor: function(linkResolver) {
         this.css = {};
         this.linkResolver = linkResolver;
      },
      loadCssAsync: function(name) {
         var self = this;
         var url = self.linkResolver.resolveLink(name, 'css');
         return IoC.resolve('ITransport', {
            method: 'GET',
            dataType: 'text',
            url: url
         }).execute();
      },
      loadCssThemedAllThemes: function(name, themes) {
         var self = this;
         var defArr = [];
         for(var i = 0; i < themes.length; i++) {
            var url = self.linkResolver.resolveCssWithTheme(name, themes[i]);
            defArr.push(IoC.resolve('ITransport', {
               method: 'GET',
               dataType: 'text',
               url: url
            }).execute());
         }
         return Promise.all(defArr);
      },
      loadCssThemed: function(name, theme) {
         var self = this;
         var defArr = [];
         var url = self.linkResolver.resolveCssWithTheme(name, theme);
         return IoC.resolve('ITransport', {
            method: 'GET',
            dataType: 'text',
            url: url
         }).execute();
      }
   });

   return CssLoader;
});