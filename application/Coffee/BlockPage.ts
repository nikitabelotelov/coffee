/// <amd-module name="Coffee/BlockPage" />

// @ts-ignore
import Control = require('Core/Control');
// @ts-ignore
import template = require('wml!Coffee/BlockPage/BlockPage');

type Setting = {
    title: String;
    template: String;
}

class BlockPage extends Control {
    public _template: Function = template;
}


export = BlockPage;
