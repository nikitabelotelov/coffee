/// <amd-module name="Core/apply-contents" />
//@ts-ignore
import isEmpty = require('Core/helpers/Object/isEmpty');
//@ts-ignore
import loadContents = require('Core/load-contents');
//@ts-ignore
import constants = require('Core/constants');

const global = (function() {
   return this || (0, eval)('this');
})();

if (global.contents && !isEmpty(global.contents)) {
   loadContents(global.contents, false, {
      resources: constants.resourceRoot
   });
}
