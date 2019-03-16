/// <amd-module name="Browser/_Transport/URL/deserializeData" />
// @ts-ignore
import * as base64 from 'Core/base64';

/**
 * Переводит строку из base64 в обычную строку.
 * @param {string} serialized
 * @returns {*}
 * @see serializeURLData
 */
export default function (serialized) {
   return JSON.parse(base64.decode(serialized));
};
