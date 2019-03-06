/// <amd-module name="Coffee/Settings/SettingsMenu" />

// @ts-ignore
import {Control} from 'UI/Base';
// @ts-ignore
import * as template from 'wml!Coffee/Settings/SettingsMenu/SettingsMenu';
import "css!Coffee/Settings/SettingsMenu/SettingsMenu";


class Info extends Control {
    public _template: Function = template;
}

export = Info;
