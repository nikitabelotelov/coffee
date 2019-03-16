/// <amd-module name="Coffee/Main" />

// @ts-ignore
import Control = require('Core/Control');
import "Core/ConsoleLogger";
// @ts-ignore
import template = require('wml!Coffee/Main/Main');

import 'css!Coffee/Main/Main';

class Main extends Control {
    public _template: Function = template;
    private settingsData: any;
}

export = Main;
