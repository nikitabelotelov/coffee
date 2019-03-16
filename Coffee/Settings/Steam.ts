/// <amd-module name="Coffee/Settings/Steam" />

// @ts-ignore
import Control = require('Core/Control');
// @ts-ignore
import * as template from 'wml!Coffee/Settings/Steam/Steam';
import "css!Coffee/Settings/Steam/Steam";
import SettingsModel from "./SettingsModel/SettingsModel";


class Steam extends Control {
    public _template: Function = template;
    private settingsModel: SettingsModel;
    private pressureValue: string = '';
    protected _beforeMount(opts) {
        this.settingsModel = opts.settingsInfo;
        this.updatePressureValue();
    };
    protected _beforeUpdate() {
        this.updatePressureValue();
    };

    private updatePressureValue() {
        this.pressureValue = this.settingsModel.getSetting('Паровой бойлер', 'Давление');
    };

    private pressureValueChanged(_, value) {
        this.settingsModel.setSetting(value, 'Паровой бойлер', 'Давление', value);
    };
}

export = Steam;
