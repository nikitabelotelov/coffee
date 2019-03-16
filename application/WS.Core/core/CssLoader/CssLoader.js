define('Core/CssLoader/CssLoader', [
   'Env/Env',
   'Core/core-extend'
], function(Env, coreExtend) {
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
      _fetchByUrl: function(url) {
         return fetch(url, { method: "get", credentials: 'include' });
      },
      _loadFile: function(url) {
         var promise = this._fetchByUrl(url);
         promise = promise.then(function (response) {
            return response.text();
         });
         promise.catch(function() {
            Env.IoC.resolve('ILogger').error('Css loading', 'Couldn\'t load css: ' + url + '');
         });
         return promise;
      }
   });

   return CssLoader;
});