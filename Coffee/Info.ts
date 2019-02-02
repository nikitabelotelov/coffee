/// <amd-module name="Coffee/Info" />

// @ts-ignore
import {Control} from 'UI/Base';
// @ts-ignore
import * as template from 'wml!Coffee/InfoPage/Info';
import "css!Coffee/InfoPage/Info";


class Info extends Control {
   public _template: Function = template;
}

export = Info;
