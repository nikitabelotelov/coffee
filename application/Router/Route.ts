/// <amd-module name="Router/Route" />

// @ts-ignore
import * as Control from 'Core/Control';
// @ts-ignore
import template = require('wml!Router/Route');

import * as Controller from 'Router/Controller';
import * as Data from 'Router/Data';
import * as MaskResolver from 'Router/MaskResolver';
import * as History from 'Router/History';

interface IRouteOptions extends HashMap<any> {
   content?: Function;
   mask?: string;
}

class Route extends Control {
   public _template: Function = template;

   private _urlOptions: HashMap<any> = null;
   private _isResolved = false;

   public _beforeMount(cfg: IRouteOptions): void {
      this._urlOptions = {};
      this._applyNewUrl(cfg.mask, cfg);
   }

   public _afterMount(): void {
      this._register();
      this._checkUrlResolved();
   }

   public _beforeUpdate(cfg: IRouteOptions) {
      this._applyNewUrl(cfg.mask, cfg);
   }

   public _beforeUnmount() {
      this._unregister();
   }

   private _register(): void {
      Controller.addRoute(
         this,
         (newLoc, oldLoc) => {
            return this._beforeApplyNewUrl(newLoc, oldLoc);
         },
         () => {
            this._forceUpdate();
            return Promise.resolve(true);
         }
      );
   }

   private _unregister(): void {
      Controller.removeRoute(this);
   }

   private _beforeApplyNewUrl(newLoc: Data.IHistoryState, oldLoc: Data.IHistoryState): Promise<boolean> {
      let result: Promise<boolean>;

      this._urlOptions = MaskResolver.calculateUrlParams(this._options.mask, newLoc.state);
      const wasResolvedParam = this._hasResolvedParams();
      this._fillUrlOptionsFromCfg(this._options);

      if (wasResolvedParam && !this._isResolved) {
         result = this._notify('enter', [newLoc, oldLoc]);
         this._isResolved = true;
      } else if (!wasResolvedParam && this._isResolved) {
         result = this._notify('leave', [newLoc, oldLoc]);
         this._isResolved = false;
      } else {
         result = Promise.resolve(true);
      }

      return result;
   }

   private _applyNewUrl(mask: string, cfg: IRouteOptions): boolean {
      this._urlOptions = MaskResolver.calculateUrlParams(mask);
      const notUndefVal = this._hasResolvedParams();
      this._fillUrlOptionsFromCfg(cfg);
      return notUndefVal;
   }

   /**
    * return flag = resolved params from URL
    */
   private _hasResolvedParams(): boolean {
      let notUndefVal = false;
      for (let i in this._urlOptions) {
         if (this._urlOptions.hasOwnProperty(i)) {
            if (this._urlOptions[i] !== undefined) {
               notUndefVal = true;
               break;
            }
         }
      }
      return notUndefVal;
   }

   private _fillUrlOptionsFromCfg(cfg: IRouteOptions): void {
      for (let i in cfg) {
         if (
            !this._urlOptions.hasOwnProperty(i) &&
            cfg.hasOwnProperty(i) &&
            i !== 'mask' &&
            i !== 'content' &&
            i !== '_logicParent'
         ) {
            this._urlOptions[i] = cfg[i];
         }
      }
   }

   private _checkUrlResolved(): Promise<boolean> {
      this._urlOptions = MaskResolver.calculateUrlParams(this._options.mask, Data.getRelativeUrl());
      const notUndefVal = this._hasResolvedParams();
      this._fillUrlOptionsFromCfg(this._options);

      const currentState = History.getCurrentState();
      let prevState = History.getPrevState();
      if (notUndefVal) {
         this._isResolved = true;
         if (!prevState) {
            prevState = {
               state: MaskResolver.calculateHref(this._options.mask, { clear: true })
            };
         }
         return this._notify('enter', [currentState, prevState]);
      }
      return Promise.resolve(true);
   }
}

export = Route;
