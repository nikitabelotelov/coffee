/// <amd-module name="Router/Route" />
define('Router/Route', [
    'require',
    'exports',
    'tslib',
    'Core/Control',
    'wml!Router/Route',
    'Router/Controller',
    'Router/Data',
    'Router/MaskResolver',
    'Router/History'
], function (require, exports, tslib_1, Control, template, Controller, Data, MaskResolver, History) {
    'use strict';
    var Route = /** @class */
    function (_super) {
        tslib_1.__extends(Route, _super);
        function Route() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._template = template;
            _this._urlOptions = null;
            _this._isResolved = false;
            return _this;
        }
        Route.prototype._beforeMount = function (cfg) {
            this._urlOptions = {};
            this._applyNewUrl(cfg.mask, cfg);
        };
        Route.prototype._afterMount = function () {
            this._register();
            this._checkUrlResolved();
        };
        Route.prototype._beforeUpdate = function (cfg) {
            this._applyNewUrl(cfg.mask, cfg);
        };
        Route.prototype._beforeUnmount = function () {
            this._unregister();
        };
        Route.prototype._register = function () {
            var _this = this;
            Controller.addRoute(this, function (newLoc, oldLoc) {
                return _this._beforeApplyNewUrl(newLoc, oldLoc);
            }, function () {
                _this._forceUpdate();
                return Promise.resolve(true);
            });
        };
        Route.prototype._unregister = function () {
            Controller.removeRoute(this);
        };
        Route.prototype._beforeApplyNewUrl = function (newLoc, oldLoc) {
            var result;
            this._urlOptions = MaskResolver.calculateUrlParams(this._options.mask, newLoc.state);
            var wasResolvedParam = this._hasResolvedParams();
            this._fillUrlOptionsFromCfg(this._options);
            if (wasResolvedParam && !this._isResolved) {
                result = this._notify('enter', [
                    newLoc,
                    oldLoc
                ]);
                this._isResolved = true;
            } else if (!wasResolvedParam && this._isResolved) {
                result = this._notify('leave', [
                    newLoc,
                    oldLoc
                ]);
                this._isResolved = false;
            } else {
                result = Promise.resolve(true);
            }
            return result;
        };
        Route.prototype._applyNewUrl = function (mask, cfg) {
            this._urlOptions = MaskResolver.calculateUrlParams(mask);
            var notUndefVal = this._hasResolvedParams();
            this._fillUrlOptionsFromCfg(cfg);
            return notUndefVal;
        };    /**
         * return flag = resolved params from URL
         */
        /**
         * return flag = resolved params from URL
         */
        Route.prototype._hasResolvedParams = function () {
            var notUndefVal = false;
            for (var i in this._urlOptions) {
                if (this._urlOptions.hasOwnProperty(i)) {
                    if (this._urlOptions[i] !== undefined) {
                        notUndefVal = true;
                        break;
                    }
                }
            }
            return notUndefVal;
        };
        Route.prototype._fillUrlOptionsFromCfg = function (cfg) {
            for (var i in cfg) {
                if (!this._urlOptions.hasOwnProperty(i) && cfg.hasOwnProperty(i) && i !== 'mask' && i !== 'content' && i !== '_logicParent') {
                    this._urlOptions[i] = cfg[i];
                }
            }
        };
        Route.prototype._checkUrlResolved = function () {
            this._urlOptions = MaskResolver.calculateUrlParams(this._options.mask, Data.getRelativeUrl());
            var notUndefVal = this._hasResolvedParams();
            this._fillUrlOptionsFromCfg(this._options);
            var currentState = History.getCurrentState();
            var prevState = History.getPrevState();
            if (notUndefVal) {
                this._isResolved = true;
                if (!prevState) {
                    prevState = { state: MaskResolver.calculateHref(this._options.mask, { clear: true }) };
                }
                return this._notify('enter', [
                    currentState,
                    prevState
                ]);
            }
            return Promise.resolve(true);
        };
        return Route;
    }(Control);
    return Route;
});