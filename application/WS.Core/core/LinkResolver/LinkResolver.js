define('Core/LinkResolver/LinkResolver', ['Core/core-extend', 'Core/helpers/getResourceUrl'], function(coreExtend, getResourceUrl) {
   'use strict';

   function joinPaths(arr) {
      var arrRes = [];
      for (var i = 0; i < arr.length; i++) {
         arrRes.push(cropSlash(arr[i]));
      }
      return arrRes.join('/');
   }

   function cropSlash(str) {
      var res = str;
      res = res.replace(/\/+$/, '');
      res = res.replace(/^\/+/, '');
      return res;
   }

   var LinkResolver = coreExtend.extend([], {
      constructor: function(isDebug, buildNumber, wsRoot, appRoot, resourceRoot) {
         this.isDebug = isDebug;
         this.buildNumber = buildNumber || '';

         this.wsRootFolder = wsRoot.replace(resourceRoot, '');

         var fullResourcePath = '';
         if (appRoot && !(resourceRoot && ~resourceRoot.indexOf(appRoot))) {
            fullResourcePath += '/' + appRoot + '/';
         }
         if (resourceRoot) {
            fullResourcePath += '/' + resourceRoot + '/';
         }
         this.resourceRoot = ('/' + fullResourcePath).replace(/[\/]+/g, '/');
         this.originResourceRoot = resourceRoot;
         this.initPaths();
      },
      resolveLinkTemplated: function(url) {
         var res = url;
         res = this.fixOldAndBundles(url);
         if(!~url.indexOf('%')) {
            res = this.originResourceRoot + res;
         }
         return res;
      },
      initPaths: function(reqPaths) {
         var reqPaths = reqPaths || requirejs.s.contexts._.config.paths;
         var paths = {};
         var name;
         var baseUrl = this.resourceRoot;
         if(typeof wsConfig !== 'undefined') {
            // TODO something with this code
            if(wsConfig._baseUrl && wsConfig._baseUrl.length > this.resourceRoot.length) {
               baseUrl = wsConfig._baseUrl;
            }
         }
         for(var key in reqPaths) {
            name = reqPaths[key];
            if(name.indexOf('/') !== 0) {
               name = '/' + name;
            }
            name = name.split(baseUrl)[1];
            paths[key] = name;
         }
         this.paths = paths;
      },
      getLinkWithResourceRoot: function(link) {
         var res = joinPaths([this.resourceRoot, link]);
         if (res.indexOf('/') !== 0) {
            res = '/' + res;
         }
         return res;
      },
      isRelativeLink: function(link) {
         if(link.indexOf('/') === 0) {
            return false;
         } else {
            return true;
         }
      },
      fixOldAndBundles: function(name) {
         var res = name;
         var replaceKey = '';
         for (var key in this.paths) {
            if (name.indexOf(key) === 0) {
               if (key.length > replaceKey.length) {
                  replaceKey = key;
               }
            }
         }
         if (replaceKey.length && this.paths[replaceKey]) {
            res = res.replace(replaceKey, this.paths[replaceKey]);
         }
         return res;
      },
      resolveLink: function(link, ext) {
         if(!this.isRelativeLink(link)) {
            return this.getLinkWithExt(link, ext, false);
         } else if(~this.resourceRoot.indexOf('%')) {
            // While generating html.tmpl resource root might be template string( for exapmple %{resource_root})
            // We shouldn't create path for file here, it will be done by PS
            return this.getLinkWithExt(this.resolveLinkTemplated(link), ext);
         }
         var res = link;
         res = this.fixOldAndBundles(res);
         res = this.getLinkWithResourceRoot(res);
         res = this.getLinkWithExt(res, ext, !this.isDebug);
         res = getResourceUrl(res);
         return res;
      },
      resolveCssWithTheme: function(link, theme) {
         var res = link;
         res = this.getLinkWithResourceRoot(res);
         res = this.getLinkWithTheme(res, theme);
         res = this.getLinkWithExt(res, 'css', !this.isDebug);
         return res;
      },
      getLinkWithTheme: function(cssName, theme) {
         if (!theme) {
            return cssName;
         }
         return cssName + '_' + theme;
      },
      /**
       *
       * @param link - link without extension
       * @param ext - extension
       * @param min - need create link for minimized files
       * @returns {string|*}
       */
      getLinkWithExt: function(link, ext, min) {
         var res = link;
         if (!min) {
            res = link + '.' + ext;
         } else {
            // Files with "min" at the end of the name will not be minified by builder
            // So we don't need to add ".min." to its extension
            if(link.slice(-3) !== 'min') {
               res = link + '.min.' + ext;
            } else {
               res = link + '.' + ext;
            }
            if (this.buildNumber) {
               res = res + '?x_version=' + this.buildNumber;
            }
         }
         return res;
      }
   });
   return LinkResolver;
});
