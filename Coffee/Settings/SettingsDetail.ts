/// <amd-module name="Coffee/Settings/SettingsDetail" />

// @ts-ignore
import Control = require('Core/Control');
// @ts-ignore
import * as template from 'wml!Coffee/Settings/SettingsDetail/SettingsDetail';
import "css!Coffee/Settings/SettingsDetail/SettingsDetail";
import {DataStore} from "../Data/DataStore";


class SettingsDetail extends Control {
    public _template: Function = template;
    public settingChangedHandler(event, value) {
        this._notify('valueChanged', [value]);
    };
}

export = SettingsDetail;
