/// <amd-module name="Coffee/Settings/Colors" />

// @ts-ignore
import Control = require('Core/Control');
// @ts-ignore
import * as template from 'wml!Coffee/Settings/Colors/Colors';
import "css!Coffee/Settings/Colors/Colors";
import SettingsModel from "./SettingsModel/SettingsModel";


class Colors extends Control {
    public _template: Function = template;
    private settingsModel: SettingsModel;
    private pressureValue: string = '';
    protected _beforeMount(opts) {
        this.settingsModel = opts.settingsInfo;
    };
    protected _beforeUpdate() {
        this.updatePressureValue();
    };
}

export = Colors;
