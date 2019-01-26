/// <amd-module name="Router/Controller" />

// @ts-ignore
import * as Control from 'Core/Control';
// @ts-ignore
import IoC = require('Core/IoC');
// @ts-ignore
import template = require('wml!Router/Controller');
// @ts-ignore
import registrar from 'Router/Registrar';

// @ts-ignore
import Router from 'Router/Route';
// @ts-ignore
import Link from 'Router/Link';

import History from 'Router/History';
import RouterHelper from 'Router/Helper';
import UrlRewriter from 'Router/UrlRewriter';

function getStateForNavigate(localState: any, historyState: any, currentUrl: string): any {
   if (!localState) {
      if (historyState && historyState.url && historyState.prettyUrl) {
         return historyState;
      } else {
         return {
            url: UrlRewriter.get(currentUrl),
            prettyUrl: currentUrl
         };
      }
   }
   return localState;
}

class Controller extends Control {
   private _registrar: registrar = null;
   private _registrarLink: registrar = null;
   private _currentRoute;
   private _registrarUpdate: registrar = null;
   private _registrarReserving: registrar = null;
   private _navigateProcessed: boolean = false;
   private _index: number = 0;
   public _template: Function = template;

   constructor(cfg: object) {
      super(cfg);
      this._currentRoute = 0;

      /*Controller doesn't work on server*/
      if (typeof window !== 'undefined') {
         this._registrar = new registrar();
         this._registrarUpdate = new registrar();
         this._registrarLink = new registrar();
         this._registrarReserving = new registrar();

         let skipped = false;
         window.onpopstate = (event: any) => {
            if (skipped) {
               skipped = false;
               return;
            }
            const currentState = History.getCurrentState();

            if ((!event.state && !History.getPrevState()) ||
               event.state && (event.state.id < currentState.id)) {
               //back
               const prevState = History.getPrevState();
               const stateForNavigate = getStateForNavigate(prevState, event.state, RouterHelper.getRelativeUrl(!event.state && !History.getPrevState()));
               this.navigate(event, stateForNavigate.url, stateForNavigate.prettyUrl,
                  () => {
                     History.back();
                  });
            } else {
               //forward
               const nextState = History.getNextState();
               const stateForNavigate = getStateForNavigate(nextState, event.state, RouterHelper.getRelativeUrl());
               this.navigate(event, stateForNavigate.url, stateForNavigate.prettyUrl,
                  () => {
                     History.forward();
                  },
                  () => {
                     skipped = true;
                     history.back();
                  });
            }

         };
      }
   }

   public applyUrl(): void {
      this._registrarUpdate.startAsync({}, {});
      this._registrarLink.startAsync({}, {});
   }

   public startAsyncUpdate(newUrl: string, newPrettyUrl: string): Promise<any> {
      const state = History.getCurrentState();
      return this._registrar.startAsync({url: newUrl, prettyUrl: newPrettyUrl},
         {url: state.url, prettyUrl: state.prettyUrl}).then((values) => (values.find((value) => {
         return value === false;
      }) !== false));
   }

   public beforeApplyUrl(newUrl: string, newPrettyUrl: string): Promise<any> {
      const state = History.getCurrentState();
      const rewrittenNewUrl = UrlRewriter.get(newUrl);
      const newApp = RouterHelper.getAppNameByUrl(rewrittenNewUrl);
      const currentApp = RouterHelper.getAppNameByUrl(state.url);

      return this.startAsyncUpdate(rewrittenNewUrl, newPrettyUrl).then((result) => {
         if (newApp === currentApp) {
            return result;
         } else {
            return new Promise((resolve, reject) => {
               require([newApp], (appComponent) => {
                  if (!appComponent) {
                     this._handleAppRequireError(
                        `requirejs did not report an error, but '${newApp}' component was not loaded. ` +
                        'This could have happened because of circular dependencies or because ' +
                        'of the browser behavior. Starting default redirect',
                        newPrettyUrl
                     );
                     reject(new Error('App component is not defined'));
                  } else {
                     const changed = this._notify('changeApplication', [newApp], {bubbling: true});
                     if (!changed) {
                        this.startAsyncUpdate(rewrittenNewUrl, newPrettyUrl).then((ret) => {
                           resolve(ret);
                        });
                     }
                     resolve(true);
                  }
               }, (err) => {
                  // If the folder doesn't have /Index component, it does not
                  // use new routing. Load the page manually
                  this._handleAppRequireError(
                     `Unable to load module '${newApp}', starting default redirect`,
                     newPrettyUrl
                  );

                  reject(err);
               });
            });
         }
      });
   }
   //co.navigate({}, '(.*)asda=:cmp([^&]*)(&)?(.*)?', {cmp:'asdasdasd123'})
   //co.navigate({}, '(.*)/edo/:idDoc([^/?]*)(.*)?', {idDoc:'8985'})
   //co.navigate({}, '/app/:razd/:idDoc([^/?]*)(.*)?', {razd: 'sda', idDoc:'12315'})

   public navigate(event: object, newUrl: string, newPrettyUrl: string, callback?: Function, errback?: Function): void {
      const rewrittenNewUrl = UrlRewriter.get(newUrl);
      const prettyUrl = newPrettyUrl || newUrl;
      const currentState = History.getCurrentState();

      if (currentState.url === rewrittenNewUrl || this._navigateProcessed) {
         return;
      }
      this._navigateProcessed = true;
      //this.startReserving();
      this.beforeApplyUrl(rewrittenNewUrl, prettyUrl).then((accept: boolean) => {
         this._navigateProcessed = false;
         if (accept) {
            if (callback) {
               callback();
            } else {
               History.push(rewrittenNewUrl, prettyUrl);
            }
            this.applyUrl();
         } else if (errback) {
            errback();
         }
      }, (err) => {
         this._navigateProcessed = false;
         if (errback) {
            errback(err);
         }
      });
   }

   public routerCreated(event: Event, inst: Router): void {
      this._registrar.register(event, inst, (newUrl, oldUrl) => {
         return inst.beforeApplyUrl(newUrl, oldUrl);
      });

      this._registrarUpdate.register(event, inst, (newUrl, oldUrl) => {
         return inst.applyNewUrl();
      });

      this._registrarReserving.register(event, inst, (newUrl) => {
         const res = inst._reserve(this._index, newUrl);
         if (res !== -1) {
            this._index = res;
         }
      });
      //this.startReserving();
   }
   /*public startReserving() {
      this._index = 0;
      // this._registrarReserving.start(newUrl); //todo запуск резервирования кусков url роутами
   }*/

   public routerDestroyed(event: Event, inst: Router, mask: string): void {
      this._registrar.unregister(event, inst);
      this._registrarUpdate.unregister(event, inst);
      this._registrarReserving.unregister(event, inst);

      //this.startReserving();
   }

   public linkCreated(event: Event, inst: Link): void {
      this._registrarLink.register(event, inst, () => {
         return inst.recalcHref();
      });
   }

   public linkDestroyed(event: Event, inst: Link): void {
      this._registrarLink.unregister(event, inst);
   }

   private _handleAppRequireError(errMsg: string, redirectUrl: string): void {
      IoC.resolve('ILogger').log(
         'Router/Controller',
         errMsg
      );
      if (window) {
         window.location.href = redirectUrl;
      }
   }
}

export = Controller;
