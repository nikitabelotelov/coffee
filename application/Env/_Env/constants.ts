/// <amd-module name="Env/_Env/constants" />
import compatibility = require('Env/_Env/compatibility');
import detection = require('Env/_Env/detection');
import constants from 'Env/Constants';
export default Object.assign(constants, {
    browser: detection,
    compatibility
});
