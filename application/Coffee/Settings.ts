/// <amd-module name="Coffee/Settings" />

// @ts-ignore
import {Control} from 'UI/Base';
// @ts-ignore
import template = require('wml!Coffee/Settings/Settings');
import {DataStore} from "./Data/DataStore";

import "css!Coffee/Settings/Settings";

class Settings extends Control {
   public _template: Function = template;
   private settingsInfo: any = {};
   protected _beforeMount(opts) {
      var initialSettings = DataStore.getInitialSettings();
      if(initialSettings) {
         this.settingsInfo = initialSettings;
      } else {
         DataStore.on("initialSettings", () => {
            this.settingsInfo = DataStore.getInitialSettings();
            this._forceUpdate();
            DataStore.removeHandler("initialSettings");
         })
      }
   };
   public settingChangedHandler(event, value) {
      DataStore.sendSettings(this.settingsInfo);
   };
   public checkUpdate(): void {
      DataStore.closeConnection();
      setTimeout(() => {
         fetch("/Update").then(() => {
            console.log("Update started");
         }, () => {
            console.error("Update failed");
         });
      }, 2000);
   };
}


export = Settings;
