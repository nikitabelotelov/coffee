define('Core/LinkResolver/LinkResolver', ['Core/core-extend', 'Core/helpers/getResourceUrl', 'Core/constants'], function(coreExtend, getResourceUrl, constants) {
   'use strict';

   function joinPaths(arr) {
      var arrRes = [];
      for (var i = 0; i < arr.length; i++) {
         arrRes.push(cropSlash(arr[i]));
      }
      return arrRes.join('/');
   }

   function cropSlash(str, onlyEnding) {
      var res = str;
      res = res.replace(/(\/|\\)+$/, '');
      if (!onlyEnding) {
         res = res.replace(/^(\/|\\)+/, '');
      }
      return res;
   }

   // Need this code for compatibility with old controls
   // Some old module names are not the same as its physical address
   // So we need to replace parts of these adresses
   // We cannot get it from require's config.js because it's not amd-module
   // native require doesn't work properly with relative paths while building html.tmpl
   // and we doesn't have baseUrl to create absolute path
   function createRequireRoutes() {
      return {
         'WS': 'WS.Core',
         'Lib': 'WS.Core/lib',
         'Ext': 'WS.Core/lib/Ext',
         'Deprecated': 'WS.Deprecated',
         'Helpers': 'WS.Core/core/helpers',
         'Transport': 'WS.Core/transport',
         'bootup': 'WS.Core/res/js/bootup',
         'bootup-min': 'WS.Core/res/js/bootup-min',
         'old-bootup': 'WS.Core/res/js/old-bootup',
         'tslib': 'WS.Core/ext/tslib',
         'Resources': '',
         'Core': 'WS.Core/core',
         'css': 'WS.Core/ext/requirejs/plugins/css',
         'native-css': 'WS.Core/ext/requirejs/plugins/native-css',
         'normalize': 'WS.Core/ext/requirejs/plugins/normalize',
         'html': 'WS.Core/ext/requirejs/plugins/html',
         'tmpl': 'WS.Core/ext/requirejs/plugins/tmpl',
         'wml': 'WS.Core/ext/requirejs/plugins/wml',
         'text': 'WS.Core/ext/requirejs/plugins/text',
         'is': 'WS.Core/ext/requirejs/plugins/is',
         'is-api': 'WS.Core/ext/requirejs/plugins/is-api',
         'i18n': 'WS.Core/ext/requirejs/plugins/i18n',
         'json': 'WS.Core/ext/requirejs/plugins/json',
         'order': 'WS.Core/ext/requirejs/plugins/order',
         'template': 'WS.Core/ext/requirejs/plugins/template',
         'cdn': 'WS.Core/ext/requirejs/plugins/cdn',
         'datasource': 'WS.Core/ext/requirejs/plugins/datasource',
         'xml': 'WS.Core/ext/requirejs/plugins/xml',
         'preload': 'WS.Core/ext/requirejs/plugins/preload',
         'browser': 'WS.Core/ext/requirejs/plugins/browser',
         'optional': 'WS.Core/ext/requirejs/plugins/optional',
         'remote': 'WS.Core/ext/requirejs/plugins/remote',

         'router': 'router',

         'jquery': '/cdn/jquery/3.3.1/jquery-min'
      };
   }

   function replaceBackslash(str) {
      var res = str;
      res = res.replace(/\\/g, '/');
      return res;
   }

   var baseUrl = cropSlash(replaceBackslash(wsConfig._baseUrl), true);

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
         res = this.fixOld(url);
         if(!~url.indexOf('%')) {
            res = this.originResourceRoot + res;
         }
         return res;
      },
      initPathsServerSide: function() {
         var paths = createRequireRoutes();
         this.paths = paths;
      },
      getConstantsModulesInfo: function() {
         if (constants.modules) {
            return constants.modules;
         } else {
            return {};
         }
      },
      hasServicePath: function(moduleName) {
         var modulesInfo = this.getConstantsModulesInfo();
         var imodule = moduleName.split('/')[0];
         if (modulesInfo && modulesInfo[imodule] && modulesInfo[imodule].path) {
            return true;
         } else {
            return false;
         }
      },
      getLinkWithServicePath: function(moduleName) {
         var modulesInfo = this.getConstantsModulesInfo();
         var splitted = moduleName.split('/');
         var imodule = splitted[0];
         var imoduleRelativePath = splitted.slice(1).join('/');
         var sp = modulesInfo[imodule].path;
         var result = sp + '/' + imoduleRelativePath;
         return result;
      },
      initPaths: function(reqPaths) {
         if (typeof window === 'undefined') {
            this.initPathsServerSide();
         } else {
            var reqPaths = reqPaths || requirejs.s.contexts._.config.paths;
            var paths = {};
            var name;
            for (var key in reqPaths) {
               name = reqPaths[key];
               if (name.indexOf('/') !== 0) {
                  name = '/' + name;
               }
               name = name.split(this.resourceRoot)[1];
               paths[key] = name;
            }
            this.paths = paths;
         }
      },
      getLinkWithResourceRoot: function(link) {
         var res;
         if (this.hasServicePath(link)) {
            res = this.getLinkWithServicePath(link);
         } else {
            res = joinPaths([this.resourceRoot, link]);
            if (res.indexOf('/') !== 0) {
               res = '/' + res;
            }
         }
         return res;
      },
      isRelativeLink: function(link) {
         if (link.indexOf('/') === 0) {
            return false;
         } else {
            return true;
         }
      },
      fixOld: function(name) {
         var res = name;
         var replaceKey = '';
         var imodule = name.split('/')[0];
         if(this.paths[imodule] && res.indexOf(imodule) === 0) {
            replaceKey = imodule;
         }
         if (replaceKey.length && this.paths[replaceKey]) {
            res = res.replace(replaceKey, this.paths[replaceKey]);
         }
         return res;
      },
      resolveLink: function(link, ext) {
         if (!this.isRelativeLink(link)) {
            return this.getLinkWithExt(link, ext, false);
         } else if (~this.resourceRoot.indexOf('%')) {
            // While generating html.tmpl resource root might be template string( for exapmple %{resource_root})
            // We shouldn't create path for file here, it will be done by PS
            return this.getLinkWithExt(this.resolveLinkTemplated(link), ext);
         }
         var res = link;
         res = this.fixOld(res);
         res = this.getLinkWithResourceRoot(res);
         res = this.getLinkWithExt(res, ext, !this.isDebug);
         res = getResourceUrl(res); // Creates path based on parameters of static domains
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
            if (link.slice(-3) !== 'min') {
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
