/// <amd-module name="Coffee/PageNavigator" />

// @ts-ignore
import {Control} from 'UI/Base';
import "Core/ConsoleLogger";
// @ts-ignore
import template = require('wml!Coffee/PageNavigator/PageNavigator');

import 'css!Coffee/PageNavigator/PageNavigator';

class Main extends Control {
    public _template: Function = template;
}

export = Main;
