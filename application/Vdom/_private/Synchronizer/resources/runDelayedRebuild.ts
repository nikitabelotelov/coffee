/// <amd-module name="Vdom/_private/Synchronizer/resources/runDelayedRebuild" />

// @ts-ignore
import * as runDelayed from 'Core/helpers/Function/runDelayed';

var checkPageVisibility = function checkPageVisibility() {
   var hidden = null;
   if (typeof document !== 'undefined') {
      if (typeof document.hidden !== 'undefined') {
         // Opera 12.10 and Firefox 18 and later support
         hidden = 'hidden';
      } else if (typeof (document as any).msHidden !== 'undefined') {
         hidden = 'msHidden';
      } else if (typeof (document as any).webkitHidden !== 'undefined') {
         hidden = 'webkitHidden';
      }
   }
   return hidden;
},
   pageVisibility = checkPageVisibility();

/**
 * Function runDelayedRebuild module <b>runDelayed(fn)</b>.
 *
 * Method checks if browser tab active or not and depending on tab state
 * calls function runDelayed function or setTimeout
 *
 * <h2>Function params</h2>
 * <ul>
 *     <li><b>fn</b> {Function} - function to be called asynchronously.</li>
 * </ul>
 *
 * @class Vdom/Synchronizer/resources/runDelayedRebuild
 * @public
 * @author Изыгин Н.Р.
 */
export default function runDelayedRebuild(fn) {
   if (pageVisibility && document[pageVisibility]) {
      setTimeout(fn, 0);
   } else {
      runDelayed(fn);
   }
}
