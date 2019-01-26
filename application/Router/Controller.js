/// <amd-module name="Router/Controller" />
define('Router/Controller', [
    'require',
    'exports',
    'tslib',
    'Core/Control',
    'Core/IoC',
    'wml!Router/Controller',
    'Router/Registrar',
    'Router/History',
    'Router/Helper',
    'Router/UrlRewriter'
], function (require, exports, tslib_1, Control, IoC, template, Registrar_1, History_1, Helper_1, UrlRewriter_1) {
    'use strict';
    function getStateForNavigate(localState, historyState, currentUrl) {
        if (!localState) {
            if (historyState && historyState.url && historyState.prettyUrl) {
                return historyState;
            } else {
                return {
                    url: UrlRewriter_1.default.get(currentUrl),
                    prettyUrl: currentUrl
                };
            }
        }
        return localState;
    }
    var Controller = /** @class */
    function (_super) {
        tslib_1.__extends(Controller, _super);
        function Controller(cfg) {
            var _this = _super.call(this, cfg) || this;
            _this._registrar = null;
            _this._registrarLink = null;
            _this._registrarUpdate = null;
            _this._registrarReserving = null;
            _this._navigateProcessed = false;
            _this._index = 0;
            _this._template = template;
            _this._currentRoute = 0;    /*Controller doesn't work on server*/
            /*Controller doesn't work on server*/
            if (typeof window !== 'undefined') {
                _this._registrar = new Registrar_1.default();
                _this._registrarUpdate = new Registrar_1.default();
                _this._registrarLink = new Registrar_1.default();
                _this._registrarReserving = new Registrar_1.default();
                var skipped_1 = false;
                window.onpopstate = function (event) {
                    if (skipped_1) {
                        skipped_1 = false;
                        return;
                    }
                    var currentState = History_1.default.getCurrentState();
                    if (!event.state && !History_1.default.getPrevState() || event.state && event.state.id < currentState.id) {
                        //back
                        var prevState = History_1.default.getPrevState();
                        var stateForNavigate = getStateForNavigate(prevState, event.state, Helper_1.default.getRelativeUrl(!event.state && !History_1.default.getPrevState()));
                        _this.navigate(event, stateForNavigate.url, stateForNavigate.prettyUrl, function () {
                            History_1.default.back();
                        });
                    } else {
                        //forward
                        var nextState = History_1.default.getNextState();
                        var stateForNavigate = getStateForNavigate(nextState, event.state, Helper_1.default.getRelativeUrl());
                        _this.navigate(event, stateForNavigate.url, stateForNavigate.prettyUrl, function () {
                            History_1.default.forward();
                        }, function () {
                            skipped_1 = true;
                            history.back();
                        });
                    }
                };
            }
            return _this;
        }
        Controller.prototype.applyUrl = function () {
            this._registrarUpdate.startAsync({}, {});
            this._registrarLink.startAsync({}, {});
        };
        Controller.prototype.startAsyncUpdate = function (newUrl, newPrettyUrl) {
            var state = History_1.default.getCurrentState();
            return this._registrar.startAsync({
                url: newUrl,
                prettyUrl: newPrettyUrl
            }, {
                url: state.url,
                prettyUrl: state.prettyUrl
            }).then(function (values) {
                return values.find(function (value) {
                    return value === false;
                }) !== false;
            });
        };
        Controller.prototype.beforeApplyUrl = function (newUrl, newPrettyUrl) {
            var _this = this;
            var state = History_1.default.getCurrentState();
            var rewrittenNewUrl = UrlRewriter_1.default.get(newUrl);
            var newApp = Helper_1.default.getAppNameByUrl(rewrittenNewUrl);
            var currentApp = Helper_1.default.getAppNameByUrl(state.url);
            return this.startAsyncUpdate(rewrittenNewUrl, newPrettyUrl).then(function (result) {
                if (newApp === currentApp) {
                    return result;
                } else {
                    return new Promise(function (resolve, reject) {
                        require([newApp], function (appComponent) {
                            if (!appComponent) {
                                _this._handleAppRequireError('requirejs did not report an error, but \'' + newApp + '\' component was not loaded. ' + 'This could have happened because of circular dependencies or because ' + 'of the browser behavior. Starting default redirect', newPrettyUrl);
                                reject(new Error('App component is not defined'));
                            } else {
                                var changed = _this._notify('changeApplication', [newApp], { bubbling: true });
                                if (!changed) {
                                    _this.startAsyncUpdate(rewrittenNewUrl, newPrettyUrl).then(function (ret) {
                                        resolve(ret);
                                    });
                                }
                                resolve(true);
                            }
                        }, function (err) {
                            // If the folder doesn't have /Index component, it does not
                            // use new routing. Load the page manually
                            _this._handleAppRequireError('Unable to load module \'' + newApp + '\', starting default redirect', newPrettyUrl);
                            reject(err);
                        });
                    });
                }
            });
        };    //co.navigate({}, '(.*)asda=:cmp([^&]*)(&)?(.*)?', {cmp:'asdasdasd123'})
              //co.navigate({}, '(.*)/edo/:idDoc([^/?]*)(.*)?', {idDoc:'8985'})
              //co.navigate({}, '/app/:razd/:idDoc([^/?]*)(.*)?', {razd: 'sda', idDoc:'12315'})
        //co.navigate({}, '(.*)asda=:cmp([^&]*)(&)?(.*)?', {cmp:'asdasdasd123'})
        //co.navigate({}, '(.*)/edo/:idDoc([^/?]*)(.*)?', {idDoc:'8985'})
        //co.navigate({}, '/app/:razd/:idDoc([^/?]*)(.*)?', {razd: 'sda', idDoc:'12315'})
        Controller.prototype.navigate = function (event, newUrl, newPrettyUrl, callback, errback) {
            var _this = this;
            var rewrittenNewUrl = UrlRewriter_1.default.get(newUrl);
            var prettyUrl = newPrettyUrl || newUrl;
            var currentState = History_1.default.getCurrentState();
            if (currentState.url === rewrittenNewUrl || this._navigateProcessed) {
                return;
            }
            this._navigateProcessed = true;    //this.startReserving();
            //this.startReserving();
            this.beforeApplyUrl(rewrittenNewUrl, prettyUrl).then(function (accept) {
                _this._navigateProcessed = false;
                if (accept) {
                    if (callback) {
                        callback();
                    } else {
                        History_1.default.push(rewrittenNewUrl, prettyUrl);
                    }
                    _this.applyUrl();
                } else if (errback) {
                    errback();
                }
            }, function (err) {
                _this._navigateProcessed = false;
                if (errback) {
                    errback(err);
                }
            });
        };
        Controller.prototype.routerCreated = function (event, inst) {
            var _this = this;
            this._registrar.register(event, inst, function (newUrl, oldUrl) {
                return inst.beforeApplyUrl(newUrl, oldUrl);
            });
            this._registrarUpdate.register(event, inst, function (newUrl, oldUrl) {
                return inst.applyNewUrl();
            });
            this._registrarReserving.register(event, inst, function (newUrl) {
                var res = inst._reserve(_this._index, newUrl);
                if (res !== -1) {
                    _this._index = res;
                }
            });    //this.startReserving();
        };    /*public startReserving() {
           this._index = 0;
           // this._registrarReserving.start(newUrl); //todo запуск резервирования кусков url роутами
        }*/
        //this.startReserving();
        /*public startReserving() {
           this._index = 0;
           // this._registrarReserving.start(newUrl); //todo запуск резервирования кусков url роутами
        }*/
        Controller.prototype.routerDestroyed = function (event, inst, mask) {
            this._registrar.unregister(event, inst);
            this._registrarUpdate.unregister(event, inst);
            this._registrarReserving.unregister(event, inst);    //this.startReserving();
        };
        //this.startReserving();
        Controller.prototype.linkCreated = function (event, inst) {
            this._registrarLink.register(event, inst, function () {
                return inst.recalcHref();
            });
        };
        Controller.prototype.linkDestroyed = function (event, inst) {
            this._registrarLink.unregister(event, inst);
        };
        Controller.prototype._handleAppRequireError = function (errMsg, redirectUrl) {
            IoC.resolve('ILogger').log('Router/Controller', errMsg);
            if (window) {
                window.location.href = redirectUrl;
            }
        };
        return Controller;
    }(Control);
    return Controller;
});