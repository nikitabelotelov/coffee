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

    protected _beforeMount() {
        return DataStore.initDataStore();
    }
}

export = CoffeeApplication;
