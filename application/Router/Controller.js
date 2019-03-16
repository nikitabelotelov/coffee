/// <amd-module name="Router/Controller" />
define('Router/Controller', [
    'require',
    'exports',
    'Env/Env',
    'Router/Data',
    'Router/MaskResolver',
    'Router/History',
    'Router/UrlRewriter'
], function (require, exports, Env_1, Data, MaskResolver_1, History, UrlRewriter) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var isNavigating = false;
    _initializeController();
    function canChangeApplication() {
        // Router can switch applications when there is an Application/Core
        // instance on it
        return !!Data.getCoreInstance();
    }
    exports.canChangeApplication = canChangeApplication;
    function navigate(newState, callback, errback) {
        var rewrittenNewUrl = UrlRewriter.get(newState.state);
        var prettyUrl = newState.href || newState.state;
        var currentState = History.getCurrentState();
        if (currentState.state === rewrittenNewUrl || isNavigating) {
            return;
        }
        var rewrittenNewState = {
            state: rewrittenNewUrl,
            href: prettyUrl
        };
        isNavigating = true;
        _tryApplyNewState(rewrittenNewState).then(function (accept) {
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
        }, function (err) {
            isNavigating = false;
            errback && errback(err);
        });
    }
    exports.navigate = navigate;
    function addRoute(route, beforeUrlChangeCb, afterUrlChangeCb) {
        Data.getRegisteredRoutes()[route.getInstanceId()] = {
            beforeUrlChangeCb: beforeUrlChangeCb,
            afterUrlChangeCb: afterUrlChangeCb
        };
    }
    exports.addRoute = addRoute;
    function removeRoute(route) {
        delete Data.getRegisteredRoutes()[route.getInstanceId()];
    }
    exports.removeRoute = removeRoute;
    function addReference(reference, afterUrlChangeCb) {
        Data.getRegisteredReferences()[reference.getInstanceId()] = { afterUrlChangeCb: afterUrlChangeCb };
    }
    exports.addReference = addReference;
    function removeReference(reference) {
        delete Data.getRegisteredReferences()[reference.getInstanceId()];
    }
    exports.removeReference = removeReference;
    function _initializeController() {
        if (typeof window !== 'undefined') {
            var skipNextChange_1 = false;
            window.onpopstate = function (event) {
                if (skipNextChange_1) {
                    skipNextChange_1 = false;
                    return;
                }
                var currentState = History.getCurrentState();
                var prevState = History.getPrevState();
                if (!event.state && !prevState || event.state && event.state.id < currentState.id) {
                    // going back
                    var navigateToState = _getNavigationState(prevState, event.state, event.state || prevState ? Data.getRelativeUrl() : Data.getVisibleRelativeUrl());
                    navigate(navigateToState, function () {
                        return History.back();
                    });
                } else {
                    // going forward
                    var nextState = History.getNextState();
                    var navigateToState = _getNavigationState(nextState, event.state, Data.getRelativeUrl());
                    navigate(navigateToState, function () {
                        return History.forward();
                    }, function () {
                        // unable to navigate to specified state, going back in history
                        skipNextChange_1 = true;
                        window.history.back();
                    });
                }
            };
        }
    }
    function _getNavigationState(localState, windowState, currentUrl) {
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
    function _tryApplyNewState(newState) {
        var state = History.getCurrentState();
        var newApp = MaskResolver_1.getAppNameByUrl(newState.state);
        var currentApp = MaskResolver_1.getAppNameByUrl(state.state);
        return _checkRoutesAcceptNewState(newState).then(function (result) {
            if (newApp === currentApp) {
                return result;
            } else {
                return new Promise(function (resolve, reject) {
                    require([newApp], function (appComponent) {
                        if (!appComponent) {
                            _handleAppRequireError('requirejs did not report an error, but \'' + newApp + '\' component was not loaded. ' + 'This could have happened because of circular dependencies or because ' + 'of the browser behavior. Starting default redirect', newState.href);
                            reject(new Error('App component is not defined'));
                        } else {
                            var changedApp = _tryChangeApplication(newApp);
                            if (!changedApp) {
                                _checkRoutesAcceptNewState(newState).then(function (ret) {
                                    resolve(ret);
                                });
                            }
                            resolve(true);
                        }
                    }, function (err) {
                        // If the folder doesn't have /Index component, it does not
                        // use new routing. Load the page manually
                        _handleAppRequireError('Unable to load module \'' + newApp + '\', starting default redirect', newState.href);
                        reject(err);
                    });
                });
            }
        });
    }
    function _checkRoutesAcceptNewState(newState) {
        var currentState = History.getCurrentState();
        var registeredRoutes = Data.getRegisteredRoutes();
        var promises = [];
        for (var routeId in registeredRoutes) {
            if (registeredRoutes.hasOwnProperty(routeId)) {
                var route = registeredRoutes[routeId];
                promises.push(route.beforeUrlChangeCb(newState, currentState));
            }
        }    // Make sure none of the registered routes responded with 'false'
        // Make sure none of the registered routes responded with 'false'
        return Promise.all(promises).then(function (results) {
            return results.indexOf(false) === -1;
        });
    }
    function _notifyStateChanged(newState, oldState) {
        var registeredRoutes = Data.getRegisteredRoutes();
        var registeredReferences = Data.getRegisteredReferences();
        for (var routeId in registeredRoutes) {
            if (registeredRoutes.hasOwnProperty(routeId)) {
                registeredRoutes[routeId].afterUrlChangeCb(newState, oldState);
            }
        }
        for (var referenceId in registeredReferences) {
            if (registeredReferences.hasOwnProperty(referenceId)) {
                registeredReferences[referenceId].afterUrlChangeCb(newState, oldState);
            }
        }
    }
    function _tryChangeApplication(newAppName) {
        var core = Data.getCoreInstance();
        return core && core.changeApplicationHandler(null, newAppName);
    }
    function _handleAppRequireError(errMsg, redirectUrl) {
        Env_1.IoC.resolve('ILogger').log('Router/Controller', errMsg);
        if (window) {
            window.location.href = redirectUrl;
        }
    }
});