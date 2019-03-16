/// <amd-module name="Coffee/Settings/Group2" />

// @ts-ignore
import Control = require('Core/Control');
// @ts-ignore
import * as template from 'wml!Coffee/Settings/Group2/Group2';
import "css!Coffee/Settings/Group2/Group2";
import SettingsModel from "./SettingsModel/SettingsModel";


class Group2 extends Control {
    public _template: Function = template;
    private settingsModel: SettingsModel;
    private currentSetting: string = '';
    private currentSettingValue: string = '';
    protected _beforeMount(opts) {
        this.settingsModel = opts.settingsInfo;
    };
    protected _beforeUpdate() {
        if(this.currentSetting) {
            this.updateCurrentSettingValue(this.currentSetting);
        }
    };

    private updateCurrentSettingValue(setting: string) {
        this.currentSettingValue = this.settingsModel.getSetting('Группа 2', this.currentSetting);
    };

    private chooseSetting(_, setting) {
        this.currentSetting = setting;
    };
    private settingValueChanged(_, value) {
        if(this.currentSetting) {
            this.settingsModel.setSetting(value, 'Группа 2', this.currentSetting, value);
        }
    };
}

export = Group2;
