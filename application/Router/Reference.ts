/// <amd-module name="Router/Reference" />

// @ts-ignore
import * as Control from 'Core/Control';
// @ts-ignore
import template = require('wml!Router/Reference');

import * as Controller from 'Router/Controller';
import * as MaskResolver from 'Router/MaskResolver';
import { IHistoryState } from 'Router/Data';

interface IReferenceOptions extends HashMap<any> {
   content?: Function;
   state?: string;
   href?: string;
   clear?: boolean;
}

class Reference extends Control {
   public _template: Function = template;

   private _state: string;
   private _href: string;

   public _beforeMount(cfg: IReferenceOptions): void {
      this._recalcHref(cfg);
   }

   public _afterMount(): void {
      this._register();
   }

   public _beforeUpdate(cfg: IReferenceOptions): void {
      this._recalcHref(cfg);
   }

   public _beforeUnmount() {
      this._unregister();
   }

   private _register(): void {
      Controller.addReference(this, () => {
         this._recalcHref(this._options);
         this._forceUpdate();
         return Promise.resolve(true);
      });
   }

   private _unregister(): void {
      Controller.removeReference(this);
   }

   private _recalcHref(cfg: IReferenceOptions): void {
      this._state = MaskResolver.calculateHref(cfg.state, cfg);
      if (cfg.href) {
         this._href = MaskResolver.calculateHref(cfg.href, cfg);
      } else {
         this._href = undefined;
      }
   }

   private _clickHandler(e: Event): void {
      e.preventDefault();
      this._changeUrlState({
         state: this._state,
         href: this._href
      });
   }

   private _changeUrlState(newState: IHistoryState): void {
      Controller.navigate(newState);
   }
}

export = Reference;
