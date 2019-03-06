/// <amd-module name="Coffee/Settings" />

// @ts-ignore
import {Control} from 'UI/Base';
// @ts-ignore
import template = require('wml!Coffee/Settings/Settings');
import {DataStore} from "./Data/DataStore";
import {SettingsModel} from "Coffee/Settings/SettingsModel/SettingsModel";

import "css!Coffee/Settings/Settings";


class Settings extends Control {
   public _template: Function = template;
   private settingsInfo: any;
   protected _beforeMount(opts) {
      let promiseResult = new Promise((resolve, reject) => {
         let initialSettings = DataStore.getInitialSettings();
         if(initialSettings) {
            this.saveSettings(initialSettings);
            resolve();
         } else {
            DataStore.on("initialSettings", () => {
               this.saveSettings(DataStore.getInitialSettings());
               this._forceUpdate();
               DataStore.removeHandler("initialSettings");
               resolve();
            })
         }
      });
      return promiseResult;
   };
   public settingChangedHandler(event, value) {
      DataStore.sendSettings(this.settingsInfo);
   };
   private saveSettings(settings) {
      let parsedSettings = SettingsModel.parseSettings(settings);
      this.settingsInfo = {
         settingsInfo: new SettingsModel(parsedSettings)
      };
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
