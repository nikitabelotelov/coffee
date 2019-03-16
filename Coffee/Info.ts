/// <amd-module name="Coffee/Info" />

// @ts-ignore
import Control = require('Core/Control');
// @ts-ignore
import * as template from 'wml!Coffee/Info/Info';
import "css!Coffee/Info/Info";
import {DataStore} from "Coffee/Data/DataStore";


class Info extends Control {
   public _template: Function = template;
   private currentInfo: any = {};
   private currentInfoUpdated(currentInfo): void {
      this.currentInfo = currentInfo;
      this._forceUpdate();
   };
   protected _beforeMount(opts) {
      DataStore.on('currentInfoUpdate', this.currentInfoUpdated.bind(this));
   };
   protected _beforeUnmount() {
      DataStore.removeHandler('currentInfoUpdate');
   }
}

export = Info;
