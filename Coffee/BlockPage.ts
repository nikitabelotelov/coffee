/// <amd-module name="Coffee/Settings" />

// @ts-ignore
import {Control} from 'UI/Index';
// @ts-ignore
import template = require('wml!Coffee/Settings/Settings');

import "css!Coffee/Settings/Settings";

type Setting = {
    title: String;
    template: String;
}

class Settings extends Control {
    public _template: Function = template;
    public checkUpdate(): void {
        fetch("").then(() => {

        }, () => {

        })
    };
}


export = Settings;
