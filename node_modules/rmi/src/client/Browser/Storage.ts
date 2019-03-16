/// <amd-module name="Browser/Storage" />
import * as storageUtils from 'Browser/_Storage/utils';
export { default as LocalStorage } from 'Browser/_Storage/Local';
export { default as LocalStorageNative } from 'Browser/_Storage/LocalNative';
export { default as SessionStorage } from 'Browser/_Storage/Session';
export let utils = storageUtils;
