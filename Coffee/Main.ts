/// <amd-module name="Coffee/Main" />

// @ts-ignore
import {Control} from 'UI/Base';
import "Core/ConsoleLogger";
// @ts-ignore
import template = require('wml!Coffee/Main/Main');
import {DataStore} from "Coffee/Data/DataStore";

import 'css!Coffee/Main/Main';

class Main extends Control {
    public _template: Function = template;
    private settingsData: any;

    private updateSettingsData(data): void {
        this.settingsData = data;
        this._forceUpdate();
    };

    protected _beforeMount() {
        return DataStore.initDataStore().then(() => {
            DataStore.onSettingsUpdated(this.updateSettingsData.bind(this));

        });
    }
}

export = Main;
