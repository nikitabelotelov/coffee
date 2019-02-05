/// <amd-module name="Coffee/Settings/NumberInput" />

// @ts-ignore
import {Control} from 'UI/Base';
// @ts-ignore
import * as template from 'wml!Coffee/Settings/NumberInput/NumberInput';
import "css!Coffee/Settings/NumberInput/NumberInput";


class Info extends Control {
    public _template: Function = template;
    private inputValue;
    protected _beforeMount(opts) {
       this.inputValue = opts.value;
    };
    private increment(): void {
        this.inputValue = this.inputValue + 1;
    };
    private decrement(): void {
        this.inputValue = this.inputValue - 1;
    }
}

export = Info;
