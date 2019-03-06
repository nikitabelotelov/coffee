/// <amd-module name="Router/Controller" />

// @ts-ignore
import { IoC } from 'Env/Env';

import * as Data from 'Router/Data';

import { getAppNameByUrl } from 'Router/MaskResolver';
import * as History from 'Router/History';
import * as UrlRewriter from 'Router/UrlRewriter';

let isNavigating = false;

_initializeController();

export function canChangeApplication(): boolean {
   // Router can switch applications when there is an Application/Core
   // instance on it
   return !!Data.getCoreInstance();
}

export function navigate(newState: Data.IHistoryState, callback?: Function, errback?: Function): void {
   const rewrittenNewUrl = UrlRewriter.get(newState.state);
   const prettyUrl = newState.href || newState.state;
   const currentState = History.getCurrentState();

   if (currentState.state === rewrittenNewUrl || isNavigating) {
      return;
   }
   const rewrittenNewState: Data.IHistoryState = {
      state: rewrittenNewUrl,
      href: prettyUrl
   };

   isNavigating = true;
   _tryApplyNewState(rewrittenNewState).then(
      accept => {
         isNavigating = false;
         if (accept) {
            if (callback) {
               callback();
            } else {
               History.push(rewrittenNewState);
            }
            _notifyStateChanged(rewrittenNewState, currentState);
         } else if (errback) {
            errback();
         }
      },
      err => {
         isNavigating = false;
         errback && errback(err);
      }
   );
}

export function addRoute(route, beforeUrlChangeCb: Data.TStateChangeFunction, afterUrlChangeCb: Data.TStateChangeFunction): void {
   Data.getRegisteredRoutes()[route.getInstanceId()] = {
      beforeUrlChangeCb,
      afterUrlChangeCb
   };
}

export function removeRoute(route): void {
   delete Data.getRegisteredRoutes()[route.getInstanceId()];
}

export function addReference(reference, afterUrlChangeCb: Data.TStateChangeFunction): void {
   Data.getRegisteredReferences()[reference.getInstanceId()] = {
      afterUrlChangeCb
   };
}

export function removeReference(reference): void {
   delete Data.getRegisteredReferences()[reference.getInstanceId()];
}

function _initializeController(): void {
   if (typeof window !== 'undefined') {
      let skipNextChange = false;
      window.onpopstate = (event: PopStateEvent) => {
         if (skipNextChange) {
            skipNextChange = false;
            return;
         }

         const currentState = History.getCurrentState();
         const prevState = History.getPrevState();
         if ((!event.state && !prevState) || (event.state && event.state.id < currentState.id)) {
            // going back
            const navigateToState = _getNavigationState(
               prevState,
               event.state,
               event.state || prevState ? Data.getRelativeUrl() : Data.getVisibleRelativeUrl()
            );
            navigate(navigateToState, () => History.back());
         } else {
            // going forward
            const nextState = History.getNextState();
            const navigateToState = _getNavigationState(nextState, event.state, Data.getRelativeUrl());
            navigate(
               navigateToState,
               () => History.forward(),
               () => {
                  // unable to navigate to specified state, going back in history
                  skipNextChange = true;
                  window.history.back();
               }
            );
         }
      };
   }
}

function _getNavigationState(localState: Data.IHistoryState, windowState: Data.IHistoryState, currentUrl: string): Data.IHistoryState {
   if (!localState) {
      if (windowState && windowState.state && windowState.href) {
         return windowState;
      } else {
         return {
            state: UrlRewriter.get(currentUrl),
            href: currentUrl
         };
      }
   }
   return localState;
}

function _tryApplyNewState(newState: Data.IHistoryState): Promise<boolean> {
   const state = History.getCurrentState();
   const newApp = getAppNameByUrl(newState.state);
   const currentApp = getAppNameByUrl(state.state);

   return _checkRoutesAcceptNewState(newState).then(result => {
      if (newApp === currentApp) {
         return result;
      } else {
         return new Promise<boolean>((resolve, reject) => {
            require([newApp], appComponent => {
               if (!appComponent) {
                  _handleAppRequireError(
                     `requirejs did not report an error, but '${newApp}' component was not loaded. ` +
                        'This could have happened because of circular dependencies or because ' +
                        'of the browser behavior. Starting default redirect',
                     newState.href
                  );
                  reject(new Error('App component is not defined'));
               } else {
                  const changedApp = _tryChangeApplication(newApp);
                  if (!changedApp) {
                     _checkRoutesAcceptNewState(newState).then(ret => {
                        resolve(ret);
                     });
                  }
                  resolve(true);
               }
            }, err => {
               // If the folder doesn't have /Index component, it does not
               // use new routing. Load the page manually
               _handleAppRequireError(
                  `Unable to load module '${newApp}', starting default redirect`,
                  newState.href
               );
               reject(err);
            });
         });
      }
   });
}

function _checkRoutesAcceptNewState(newState: Data.IHistoryState): Promise<boolean> {
   const currentState = History.getCurrentState();
   const registeredRoutes = Data.getRegisteredRoutes();

   const promises = [];
   for (let routeId in registeredRoutes) {
      if (registeredRoutes.hasOwnProperty(routeId)) {
         const route: Data.IRegisteredRoute = registeredRoutes[routeId];
         promises.push(route.beforeUrlChangeCb(newState, currentState));
      }
   }

   // Make sure none of the registered routes responded with 'false'
   return Promise.all(promises).then(results => results.indexOf(false) === -1);
}

function _notifyStateChanged(newState: Data.IHistoryState, oldState: Data.IHistoryState): void {
   const registeredRoutes = Data.getRegisteredRoutes();
   const registeredReferences = Data.getRegisteredReferences();

   for (let routeId in registeredRoutes) {
      if (registeredRoutes.hasOwnProperty(routeId)) {
         registeredRoutes[routeId].afterUrlChangeCb(newState, oldState);
      }
   }

   for (let referenceId in registeredReferences) {
      if (registeredReferences.hasOwnProperty(referenceId)) {
         registeredReferences[referenceId].afterUrlChangeCb(newState, oldState);
      }
   }
}

function _tryChangeApplication(newAppName: string): boolean {
   const core = Data.getCoreInstance();
   return core && core.changeApplicationHandler(null, newAppName);
}

function _handleAppRequireError(errMsg: string, redirectUrl: string): void {
   IoC.resolve('ILogger').log('Router/Controller', errMsg);
   if (window) {
      window.location.href = redirectUrl;
   }
}
