/// <amd-module name="Coffee/CoffeeApplication" />

// @ts-ignore
import {Control} from 'UI/Base';
import "Core/ConsoleLogger";
// @ts-ignore
import template = require('wml!Coffee/CoffeeApplication/CoffeeApplication');
import {DataStore} from "Coffee/Data/DataStore";

import 'css!Coffee/CoffeeApplication/CoffeeApplication';

class CoffeeApplication extends Control {
    public _template: Function = template;
    private machineInfo: any;

    private updateSettingsData(data): void {
        this.machineInfo = data;
        this._forceUpdate();
    };

    protected _beforeMount() {
        return DataStore.initDataStore().then(() => {
            DataStore.onRawDataUpdated(this.updateSettingsData.bind(this));
        });
    }
}

export = CoffeeApplication;
