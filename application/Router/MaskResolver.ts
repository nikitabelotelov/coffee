/// <amd-module name="Router/MaskResolver" />

// @ts-ignore
import { IoC } from 'Env/Env';

import * as Data from 'Router/Data';
import * as UrlRewriter from 'Router/UrlRewriter';

interface IParam {
   name: string;
   value: any;
   urlValue?: string;
}

interface IMatchPosition {
   prefixEnd: number;
   suffixStart: number;
   name?: string;
}

export function calculateUrlParams(mask: string, url?: string): HashMap<any> {
   _validateMask(mask);
   return _getUrlParams(_calculateParams(mask, {}, url));
}

export function calculateCfgParams(mask: string, cfg: any): HashMap<any> {
   _validateMask(mask);
   return _getCfgParams(_calculateParams(mask, cfg));
}

export function calculateHref(mask: string, cfg: any): string {
   _validateMask(mask);
   cfg = cfg.clear ? {} : cfg;
   const url = UrlRewriter.get(Data.getRelativeUrl());
   return _resolveHref(url, mask, cfg);
}

// TODO Remove this?
export function getAppNameByUrl(url: string): string {
   url = UrlRewriter.get(url);
   return _getFolderNameByUrl(url) + '/Index';
}

function _validateMask(mask: string): void {
   if (mask.indexOf('/') !== -1 && mask.indexOf('=') !== -1) {
      IoC.resolve('ILogger').error('Router.MaskResolver', `Mask "${mask}" is invalid`);
   }
}

const postfix = '/undefined/undefined/undefined/undefined/undefined/undefined/undefined/undefined/undefined/undefined';
function _splitQueryAndHash(url: string): { path: string, misc: string } {
   const splitMatch = url.match(/[?#]/);
   if (splitMatch) {
      const index = splitMatch.index;
      return {
         path: url.substring(0, index).replace(/\/$/, ''),
         misc: url.slice(index)
      };
   }
   return {
      path: url.replace(/\/$/, ''),
      misc: ''
   };
}
function _calculateParams(mask: string, cfg: any, url?: string): IParam[] {
   const result: IParam[] = [];
   const fullMask = _generateFullMaskWithoutParams(mask, param => {
      result.push({
         name: param.name,
         value: cfg[param.name]
      });
   });

   let originUrl = url || Data.getRelativeUrl();
   const { path, misc } = _splitQueryAndHash(originUrl);
   originUrl = path + postfix + misc;

   const actualUrl = UrlRewriter.get(originUrl);
   const fields = actualUrl.match(fullMask);

   if (fields) {
      // fields[0] is the full url, fields[1] is prefix and fields[fields.length - 1] is suffix
      for (let j = 2; j < fields.length - 1; j++) {
         result[j - 2].urlValue = decodeURIComponent(fields[j]);

         // convert 'undefined' to undefined
         if (result[j - 2].urlValue === 'undefined') {
            result[j - 2].urlValue = undefined;
         }
      }
   }
   return result;
}

function _generateFullMaskWithoutParams(mask: string, matchedParamCb?: (param: IMatchPosition) => void): string {
   let fullMask = _generateFullMask(mask);

   const paramIndexes: IMatchPosition[] = [];
   _matchParams(fullMask, param => {
      paramIndexes.push({
         prefixEnd: param.prefixEnd,
         suffixStart: param.suffixStart
      });
      matchedParamCb && matchedParamCb(param);
   });

   for (let i = paramIndexes.length - 1; i >= 0; i--) {
      fullMask =
         fullMask.slice(0, paramIndexes[i].prefixEnd) + '([^\\/?&#]+)' + fullMask.slice(paramIndexes[i].suffixStart);
   }
   return fullMask;
}

function _generateFullMask(mask: string): string {
   let fullMask = mask;

   if (fullMask.indexOf('/') !== -1) {
      if (fullMask[0] === '/') {
         fullMask = '([/]|.*?\\.html/)' + fullMask.slice(1);
      } else {
         fullMask = '(.*?/)' + fullMask;
      }
   } else if (fullMask.indexOf('=') !== -1) {
      fullMask = '(.*?\\?|.*?&)' + fullMask;
   } else {
      fullMask = '(.*?/)' + fullMask;
   }

   if (fullMask.indexOf('=') !== -1) {
      fullMask = fullMask + '(#.*|&.+)?';
   } else {
      fullMask = fullMask + '(#.*|/.*|\\?.+)?';
   }

   return fullMask;
}

function _matchParams(mask: string, cb: (param: IMatchPosition) => void): void {
   const re = /:(\w+)/g;
   let paramMatched = re.exec(mask);
   while (paramMatched) {
      cb({
         prefixEnd: paramMatched.index,
         suffixStart: paramMatched.index + paramMatched[0].length,
         name: paramMatched[1]
      });
      paramMatched = re.exec(mask);
   }
}

function _getUrlParams(params: IParam[]): HashMap<any> {
   const res: HashMap<any> = {};
   params.forEach(param => {
      res[param.name] = param.urlValue === undefined ? undefined : decodeURIComponent(param.urlValue);
   });
   return res;
}

function _getCfgParams(params: IParam[]): HashMap<any> {
   const res: HashMap<any> = {};
   params.forEach(param => {
      res[param.name] = param.value;
   });
   return res;
}

function _resolveHref(href: string, mask: string, cfg: any): string {
   const params = _calculateParams(mask, cfg);
   const cfgParams = _getCfgParams(params);
   const urlParams = _getUrlParams(params);

   const toFind = _resolveMask(mask, urlParams);
   const toReplace = _resolveMask(mask, cfgParams);

   let result = href;
   if (toReplace && toReplace[0] === '/') {
      result = toReplace;
   } else if (toFind) {
      if (toReplace) {
         result = href.replace(toFind, toReplace);
      } else {
         if (href.indexOf('/' + toFind) !== -1) {
            result = href.replace('/' + toFind, '');
         } else if (href.indexOf('?' + toFind) !== -1) {
            const hasOtherParams = href.indexOf('?' + toFind + '&') !== -1;
            if (hasOtherParams) {
               result = href.replace('?' + toFind + '&', '?');
            } else {
               result = href.replace('?' + toFind, '');
            }
         } else if (href.indexOf('&' + toFind) !== -1) {
            result = href.replace('&' + toFind, '');
         } else {
            result = href.replace(toFind, '');
         }
      }
   } else if (toReplace) {
      const qIndex = href.indexOf('?');
      if (toReplace[0] === '/') {
         result = toReplace;
      } else {
         if (toReplace.indexOf('=') !== -1) {
            if (qIndex !== -1) {
               result += '&' + toReplace;
            } else {
               result += '?' + toReplace;
            }
         } else {
            if (qIndex !== -1) {
               result = _appendSlash(href.slice(0, qIndex)) + toReplace + href.slice(qIndex);
            } else {
               result = _appendSlash(href) + toReplace;
            }
         }
      }
   }
   return result;
}

function _resolveMask(mask: string, params: HashMap<any>): string {
   let
      paramCount = 0,
      resolvedCount = 0;
   _matchParams(mask, param => {
      paramCount++;
      if (params[param.name] !== undefined) {
         let paramValue = params[param.name];
         if (typeof paramValue !== 'string') {
            paramValue = JSON.stringify(paramValue);
         }
         paramValue = encodeURIComponent(paramValue);
         mask = mask.replace(':' + param.name, paramValue);
         resolvedCount++;
      }
   });

   let result = '';
   if (resolvedCount === paramCount) {
      result = mask;
   }
   return result;
}

// Adds a forward slash to the end of href if it doesn't end
// with a slash already
function _appendSlash(href: string): string {
   if (href[href.length - 1] === '/') {
      return href;
   } else {
      return href + '/';
   }
}

function _getFolderNameByUrl(url: string): string {
   let folderName = url || '';

   // Folder name for url '/sign_in?return=mainpage' should be 'sign_in'
   if (folderName.indexOf('?') !== -1) {
      folderName = folderName.replace(/\?.*/, '');
   }

   // Folder name for url '/news#group=testGroup' should be 'news'
   if (folderName.indexOf('#') !== -1) {
      folderName = folderName.replace(/#.*/, '');
   }

   // Folder name for '/Tasks/onMe' is 'Tasks', but folder name for
   // 'tasks.html' is 'tasks.html'
   if (folderName.indexOf('/') !== -1) {
      folderName = folderName.split('/')[1];
   }

   return folderName;
}
