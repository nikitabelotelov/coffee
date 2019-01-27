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
         return this._loadFile(url);
      },
      loadCssThemedAllThemes: function(name, themes) {
         var defArr = [];
         for(var i = 0; i < themes.length; i++) {
            defArr.push(this.loadCssThemedAsync(name, themes[i]));
         }
         return Promise.all(defArr);
      },
      loadCssThemedAsync: function(name, theme) {
         var self = this;
         var url = self.linkResolver.resolveCssWithTheme(name, theme);
         return this._loadFile(url);
      },
      _loadFile: function(url) {
         var promise = IoC.resolve('ITransport', {
            method: 'GET',
            dataType: 'text',
            url: url
         }).execute();
         promise.catch(function() {
            IoC.resolve('ILogger').error('Css loading', 'Can\'t load css: ' + url + '');
         });
         return promise;
      }
   });

   return CssLoader;
});