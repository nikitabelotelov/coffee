/// <amd-module name="Core/apply-contents" />
//@ts-ignore
import isEmpty = require('Core/helpers/Object/isEmpty');
//@ts-ignore
import { constants, loadContents } from 'Env/Env';

const global = (function() {
   return this || (0, eval)('this');
})();

if (global.contents && !isEmpty(global.contents)) {
   loadContents(global.contents, false, {
      resources: constants.resourceRoot
   });
}
