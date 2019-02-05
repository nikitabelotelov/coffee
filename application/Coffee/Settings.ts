/// <amd-module name="Coffee/Settings" />

// @ts-ignore
import {Control} from 'UI/Base';
// @ts-ignore
import template = require('wml!Coffee/Settings/Settings');
import {DataStore} from "./Data/DataStore";

import "css!Coffee/Settings/Settings";

class Settings extends Control {
   public _template: Function = template;
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
