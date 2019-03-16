/// <amd-module name="Vdom/_private/Utils/Focus" />
/**
 * Utility module that provides a cross-browser way to move focus
 * to specific elements
 */
// @ts-ignore
import { detection } from 'Env/Env';
import * as Tabindex from '../Synchronizer/resources/TabIndex';

/**
 * Moves focus to a specific HTML element
 * @param {HTMLElement} element Element to move focus to
 */
export function focus(element) {
   if (element) {
      if (detection.isIE && element.setActive) {
         // In IE, calling `focus` scrolls the focused element into view,
         // which is not the desired behavior. Built-in `setActive` method
         // makes the element active without scrolling to it
         try {
            element.setActive();
         } catch (e) {
            Tabindex.focus(element);
         }
      } else {
         Tabindex.focus(element);
      }
   }
}
