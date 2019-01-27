define('Core/Themes/ThemesControllerNew', [
   'Core/IoC',
   'Core/core-extend',
   'Core/constants',
   'View/Request',
   'Core/CssLoader/CssLoader',
   'Core/LinkResolver/LinkResolver',
   'Core/cookie'
], function(IoC, coreExtend, constants, Request, CssLoader, LinkResolver, cookie) {
   'use strict';

   /**
    * Need this class to store data about css links while loading it
    */
   var global = this || (0, eval)('this');

   var ThemesControllerNewInstance = null;

   function fixCssUrls(css, name) {
      return css.replace(/url\(.+?\)/g, function(url) {
         if (~url.indexOf('data:') || /^url\((['"])\//.test(url) || /^url\(\//.test(url)) {
            return url;
         }
         var onlyUrl = url.slice(4, -1);
         if (/^(['"]).+(['"])$/.test(onlyUrl)) {
            onlyUrl = onlyUrl.slice(1, -1);
         }
         return 'url("' + name.split('/').slice(0, -1).join('/') + '/' + onlyUrl + '")';
      });
   }

   var ThemesControllerNew = coreExtend.extend([], {
      constructor: function() {
         this.css = {};
         this.resolvedCss = {
            themed: {},
            simple: {}
         };

         var BUILD_MODE = global.contents && global.contents.buildMode || 'debug';
         var isDebug = cookie.get('s3debug') === 'true' || BUILD_MODE === 'debug';

         this.simpleCssLinks = {};
         this.themedCssLinks = {};

         this.linkResolver = new LinkResolver(
            isDebug,
            constants.buildnumber,
            constants.wsRoot,
            constants.appRoot,
            constants.resourceRoot);
         this.cssLoader = new CssLoader(this.linkResolver);
         if(typeof window !== 'undefined') {
            this.collectThemedCssFromDOM();
         }
      },

      /**
       * Collects links from DOM. Those links were generated by _Head control during server-side rendering
       * Need to collect it to switch themes
       */
      collectThemedCssFromDOM: function() {
         var links = document.getElementsByClassName('new-styles');
         for (var i = 0; i < links.length; i++) {
            var themeName = links[i].getAttribute('theme-name');
            if (themeName) {
               var cssName = links[i].getAttribute('css-name');
               if(!this.resolvedCss.themed[themeName]) {
                  this.resolvedCss.themed[themeName] = {};
               }
               this.resolvedCss.themed[themeName][cssName] = { data: links[i], count: 1 };
            } else {
               var cssName = links[i].getAttribute('css-name');
               this.resolvedCss.simple[cssName] = { data: links[i], count: 1 };
            }
         }
      },
      isCssLoaded: function(name) {
         var mayBeBundle = this.resolveModule(name);
         var cssInfo = this.resolvedCss.simple[mayBeBundle];
         return !!(cssInfo && !cssInfo.data.then);
      },
      isThemedCssLoaded: function(name, theme) {
         var mayBeBundle = this.resolveModule(name);
         var cssInfo;
         if(this.resolvedCss.themed[theme]) {
            cssInfo = this.resolvedCss.themed[theme][mayBeBundle];
         }
         return !!(cssInfo && !cssInfo.data.then);
      },
      getSimpleCssList: function() {
         return this.simpleCssLinks;
      },
      getThemedCssList: function() {
         return this.themedCssLinks;
      },
      /**
       * Add style to DOM
       * @param style - content of <style></style>
       * @param name - name of css file, which content we need to add to the DOM
       * @param theme
       * @returns {HTMLElement}
       */
      addStyle: function(style, name, theme) {
         var element = document.createElement('style');
         element.setAttribute('data-vdomignore', true);
         element.setAttribute('css-name', name);
         element.setAttribute('from-new-tc', 'true');
         if (theme) {
            element.setAttribute('theme-name', theme);
         }
         element.innerHTML = style;
         window.document.head.appendChild(element);
         return element;
      },
      pushCss: function(name) {
         if(typeof window !== undefined) {
            this.simpleCssLinks[name] = true;
            return true;
         }
      },
      pushThemedCss: function(name, theme) {
         if(typeof window !== undefined) {
            if(!this.themedCssLinks[theme]) {
               this.themedCssLinks[theme] = {};
            }
            this.themedCssLinks[theme][name] = true;
            return true;
         }
      },
      // Load css asynchronously
      pushCssAsync: function(name) {
         var self = this;
         var mayBeBundle = self.resolveModule(name);
         if (typeof self.resolvedCss.simple[mayBeBundle] !== 'undefined') {
            // We don't need to load css if it was already loaded or request is in process
            self.resolvedCss.simple[mayBeBundle].count++;
            return self.resolvedCss.simple[mayBeBundle].data;
         }
         var loadPromise = self.cssLoader.loadCssAsync(name);
         self.resolvedCss.simple[mayBeBundle] = {data: loadPromise, count: 1};
         loadPromise.then(function(res) {
            res = fixCssUrls(res, self.linkResolver.resolveLink(name, 'css'));
            self.resolvedCss.simple[mayBeBundle].data = self.addStyle(res, mayBeBundle);
         });
         return loadPromise;
      },
      // Load themed css asynchronously
      pushCssThemedAsync: function(name, theme) {
         var self = this;
         self.resolvedCss.themed[theme] = self.resolvedCss.themed[theme] || {};

         var mayBeBundle = self.resolveModule(name);
         if (typeof self.resolvedCss.themed[theme][mayBeBundle] !== 'undefined') {
            // We don't need to load css if it was already loaded or request is in process
            self.resolvedCss.themed[theme][mayBeBundle].count++;
            return self.resolvedCss.themed[theme][mayBeBundle].data;
         }
         var loadPromise = self.cssLoader.loadCssThemedAsync(name, theme);
         self.resolvedCss.themed[theme][mayBeBundle] = {data: loadPromise, count: 1};
         loadPromise.then(function(res) {
            res = fixCssUrls(res, self.linkResolver.resolveCssWithTheme(name, theme));
            self.resolvedCss.themed[theme][mayBeBundle].data = self.addStyle(res, mayBeBundle, theme);
         });
         return loadPromise;
      },

      removeCssThemed: function(name, theme) {
         var mayBeBundle = this.resolveModule(name);
         var cssInfo = this.resolvedCss.themed[theme][mayBeBundle];
         if (cssInfo) {
            if (cssInfo.data.then) {
               IoC.resolve('ILogger').error('Trying to remove loading css');
            } else if (cssInfo.count === 1) {
               cssInfo.data.remove();
               delete this.resolvedCss.themed[theme][mayBeBundle];
            } else {
               cssInfo.count--;
            }
         } else {
            IoC.resolve('ILogger').error('Trying to remove not registered css');
         }
      },
      removeCss: function(name) {
         var mayBeBundle = this.resolveModule(name);
         var cssInfo = this.resolvedCss.simple[mayBeBundle];
         if (cssInfo) {
            if (cssInfo.data.then) {
               IoC.resolve('ILogger').error('Trying to remove loading css');
            } else if (cssInfo.count === 1) {
               cssInfo.data.remove();
               delete this.resolvedCss.simple[mayBeBundle];
            } else {
               cssInfo.count--;
            }
         } else {
            IoC.resolve('ILogger').error('Trying to remove not registered css');
         }
      },
      getCss: function() {
         return this.css;
      },
      resolveModule: function(name) {
         return this.linkResolver.fixOldAndBundles(name);
      }
   });

   ThemesControllerNew.getInstance = function getInstance() {
      if (process && process.domain && process.domain.req) {
         if (!process.domain.req._$ThemesControllerNew) {
            // Create instance on server
            process.domain.req._$ThemesControllerNew = new ThemesControllerNew();
         }
         return process.domain.req._$ThemesControllerNew;
      }
      if (typeof window !== 'undefined') {
         if (!ThemesControllerNewInstance) {
            // Create instance on client
            ThemesControllerNewInstance = new ThemesControllerNew();
         }
         return ThemesControllerNewInstance;
      }
      if (global) {
         if (!global._$ThemesControllerNew) {
            // Create instance in builder task
            global._$ThemesControllerNew = new ThemesControllerNew();
         }
         return global._$ThemesControllerNew;
      }
      IoC.resolve('ILogger').error('Cannot create themes controller');
   };

   return ThemesControllerNew;
});
