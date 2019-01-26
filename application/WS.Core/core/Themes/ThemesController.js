define('Core/Themes/ThemesController', [
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

   var themesControllerInstance = null;

   function fixCssUrls(css, name) {
      return css.replace(/url\(.+?\)/g, function(url) {
         if (~url.indexOf('data:') || /^url\(('|")\//.test(url) || /^url\(\//.test(url)) {
            return url;
         }
         var onlyUrl = url.slice(4, -1);
         if(/^('|").+('|")$/.test(onlyUrl)) {
            onlyUrl = onlyUrl.slice(1, -1);
         }
         return 'url("' + name.split('/').slice(0, -1).join('/').concat('/' + onlyUrl) + '")';
      });
   }

   var ThemesController = coreExtend.extend([], {
      constructor: function() {
         this.css = {};
         this.css.themedCss = [];
         this.css.simpleCss = [];
         this.themedCssCommon = {};
         this.resolvedCss = {
            themed: {},
            simple: {}
         };

         var BUILD_MODE = global.contents && global.contents.buildMode || 'debug';
         var isDebug = cookie.get('s3debug') === 'true' || BUILD_MODE === 'debug';

         this.linkResolver = new LinkResolver(
            isDebug,
            constants.buildnumber,
            constants.wsRoot,
            constants.appRoot,
            constants.resourceRoot);
         this.cssLoader = new CssLoader(this.linkResolver);

         // Init themes list with default value "default"
         this.themes = {default: {}};
         this.resolvedCss.themed['default'] = {};

         // Init ThemesController state
         var stateRec = Request.getCurrent().stateReceiver;
         if (stateRec) {
            stateRec.register('ThemesController', this);
         }

         if (typeof window !== 'undefined') {
            this.collectThemedCssFromDOM();
         }
      },

      /**
       * Collects links from DOM. Those links were generated by _Head control during server-side rendering
       * Need to collect it to switch themes
       */
      collectThemedCssFromDOM: function() {
         var links = document.getElementsByClassName('css-bundles');
         var themed = [];
         for (var i = 0; i < links.length; i++) {
            if (links[i].getAttribute('key').indexOf('themed-css') === 0) {
               var cssName = links[i].getAttribute('css-name');
               this.themedCssCommon[cssName] = true;
               this.resolvedCss.themed[this.getCurrentTheme()][cssName] = links[i];
            }
         }
      },
      setState: function(state) {
         if (state.themes) {
            this.themes = {};
            for (var i in state.themes) {
               if (state.themes.hasOwnProperty(i)) {
                  this.setTheme(i);
                  return;
               }
            }
         }
      },
      getCurrentTheme: function() {
         return this.themes[0] || 'default';
      },
      getState: function() {

         //Пустой ключ - тема не установлена
         //точка в слое совместимости, когда нужно грузить нетемизированные css
         if (!this.themes || Object.keys(this.themes)[0] === '') {
            return {};
         }
         return {
            themes: this.themes
         };
      },
      getSimpleResolved: function() {
         return this.resolvedCss.simple;
      },
      getReqCbArray: function() {
         var arr = this.requireCbArray;
         this.requireCbArray = [];
         return arr;
      },
      getThemedResolved: function() {
         return this.resolvedCss.themed;
      },
      /**
       * Set theme. Load all themed css with new theme and removes old themed styles
       * @param theme
       */
      setTheme: function(theme) {
         var self = this;
         self.themes[theme] = true;
         self.resolvedCss.themed[theme] = {};
         var promiseArray = [];
         // Make requests to load themes css-files
         for (var key in self.themedCssCommon) {
            (function(key) {
               var promise = self.cssLoader.loadCssThemed(key, theme);
               promiseArray.push(promise.then(function(res) {
                  return {
                     name: key,
                     style: res
                  };
               }));
            })(key);
         }
         var resPromise = Promise.all(promiseArray);
         // Process result of requests
         resPromise.then(function(res) {
            for (var i = 0; i < res.length; i++) {
               var fixedCss = fixCssUrls(res[i].style, self.linkResolver.resolveLink(res[i].name, 'css'));
               var element = self.addStyle(fixedCss, res[i].name, theme);
               self.resolvedCss.themed[theme][res[i].name] = element;
            }
            for (var key in self.themes) {
               if (key !== theme) {
                  for (var cssName in self.resolvedCss.themed[key]) {
                     self.resolvedCss.themed[key][cssName].remove();
                  }
                  delete self.resolvedCss.themed[key];
                  delete self.themes[key];
               }
            }
         })
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
         if (theme) {
            element.setAttribute('theme-name', theme);
         }
         element.innerHTML = style;
         window.document.head.appendChild(element);
         return element;
      },
      // Load css asynchronously
      pushCssAsync: function(name, resolve) {
         var self = this;
         var mayBeBundle = self.linkResolver.resolveOldLink(name);
         if (typeof self.resolvedCss.simple[mayBeBundle] !== 'undefined') {
            // We don't need to load css if it was already loaded or request is in process
            return;
         }
         self.resolvedCss.simple[mayBeBundle] = '';
         self.cssLoader.loadCssAsync(name).then(function(res) {
            res = fixCssUrls(res, self.linkResolver.resolveLink(name, 'css'));
            var element = self.addStyle(res, mayBeBundle);
            self.resolvedCss.simple[mayBeBundle] = element;
            resolve();
         }).catch(function() {
            IoC.resolve('ILogger').error('Css load', 'Can\'t load css for: ' + name + '');
            resolve();
         });
      },
      // Load themed css asynchronously
      pushCssThemedAsyncAllThemes: function(name, resolve) {
         var self = this;
         var mayBeBundle = self.linkResolver.resolveOldLink(name);
         if (typeof self.themedCssCommon[mayBeBundle] !== 'undefined') {
            // We don't need to load css if it wal already loaded or request is in process
            return;
         }
         self.themedCssCommon[mayBeBundle] = true;
         var themesNames = Object.keys(self.themes);
         self.cssLoader.loadCssThemedAllThemes(name, themesNames).then(function(res) {
            for (var i = 0; i < res.length; i++) {
               res[i] = fixCssUrls(res[i], self.linkResolver.resolveCssWithTheme(name, themesNames[i]));
               var element = self.addStyle(res[i], mayBeBundle, themesNames[i]);
               self.resolvedCss.themed[themesNames[i]][name] = element;
            }
            resolve();
         }).catch(function() {
            IoC.resolve('ILogger').error('Css load', 'Can\'t load css for: ' + name + '');
            resolve();
         });
      },
      getCss: function() {
         return this.css;
      },
      initCss: function(csses) {
         this.css.themedCss = this.css.themedCss.concat(csses.themedCss);
         this.css.simpleCss = this.css.simpleCss.concat(csses.simpleCss);
      }
   });

   ThemesController.getInstance = function getInstance() {
      if (process && process.domain && process.domain.req) {
         if (!process.domain.req._$ThemesController) {
            // Create instance on server
            process.domain.req._$ThemesController = new ThemesController();
         }
         return process.domain.req._$ThemesController;
      }
      if (typeof window !== 'undefined') {
         if (!themesControllerInstance) {
            // Create instance on client
            themesControllerInstance = new ThemesController();
         }
         return themesControllerInstance;
      }
      if (global) {
         if (!global._$ThemesController) {
            // Create instance in builder task
            global._$ThemesController = new ThemesController();
         }
         return global._$ThemesController;
      }
      IoC.resolve('ILogger').error('Cannot create themes controller');
   }

   return ThemesController;
});
