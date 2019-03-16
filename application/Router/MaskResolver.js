/// <amd-module name="Router/MaskResolver" />
define('Router/MaskResolver', [
    'require',
    'exports',
    'Env/Env',
    'Router/Data',
    'Router/UrlRewriter'
], function (require, exports, Env_1, Data, UrlRewriter) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    function calculateUrlParams(mask, url) {
        _validateMask(mask);
        return _getUrlParams(_calculateParams(mask, {}, url));
    }
    exports.calculateUrlParams = calculateUrlParams;
    function calculateCfgParams(mask, cfg) {
        _validateMask(mask);
        return _getCfgParams(_calculateParams(mask, cfg));
    }
    exports.calculateCfgParams = calculateCfgParams;
    function calculateHref(mask, cfg) {
        _validateMask(mask);
        cfg = cfg.clear ? {} : cfg;
        var url = UrlRewriter.get(Data.getRelativeUrl());
        return _resolveHref(url, mask, cfg);
    }
    exports.calculateHref = calculateHref;    // TODO Remove this?
    // TODO Remove this?
    function getAppNameByUrl(url) {
        url = UrlRewriter.get(url);
        return _getFolderNameByUrl(url) + '/Index';
    }
    exports.getAppNameByUrl = getAppNameByUrl;
    function _validateMask(mask) {
        if (mask.indexOf('/') !== -1 && mask.indexOf('=') !== -1) {
            Env_1.IoC.resolve('ILogger').error('Router.MaskResolver', 'Mask "' + mask + '" is invalid');
        }
    }
    var postfix = '/undefined/undefined/undefined/undefined/undefined/undefined/undefined/undefined/undefined/undefined';
    function _splitQueryAndHash(url) {
        var splitMatch = url.match(/[?#]/);
        if (splitMatch) {
            var index = splitMatch.index;
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
    function _calculateParams(mask, cfg, url) {
        var result = [];
        var fullMask = _generateFullMaskWithoutParams(mask, function (param) {
            result.push({
                name: param.name,
                value: cfg[param.name]
            });
        });
        var originUrl = url || Data.getRelativeUrl();
        var _a = _splitQueryAndHash(originUrl), path = _a.path, misc = _a.misc;
        originUrl = path + postfix + misc;
        var actualUrl = UrlRewriter.get(originUrl);
        var fields = actualUrl.match(fullMask);
        if (fields) {
            // fields[0] is the full url, fields[1] is prefix and fields[fields.length - 1] is suffix
            for (var j = 2; j < fields.length - 1; j++) {
                result[j - 2].urlValue = decodeURIComponent(fields[j]);    // convert 'undefined' to undefined
                // convert 'undefined' to undefined
                if (result[j - 2].urlValue === 'undefined') {
                    result[j - 2].urlValue = undefined;
                }
            }
        }
        return result;
    }
    function _generateFullMaskWithoutParams(mask, matchedParamCb) {
        var fullMask = _generateFullMask(mask);
        var paramIndexes = [];
        _matchParams(fullMask, function (param) {
            paramIndexes.push({
                prefixEnd: param.prefixEnd,
                suffixStart: param.suffixStart
            });
            matchedParamCb && matchedParamCb(param);
        });
        for (var i = paramIndexes.length - 1; i >= 0; i--) {
            fullMask = fullMask.slice(0, paramIndexes[i].prefixEnd) + '([^\\/?&#]+)' + fullMask.slice(paramIndexes[i].suffixStart);
        }
        return fullMask;
    }
    function _generateFullMask(mask) {
        var fullMask = mask;
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
    function _matchParams(mask, cb) {
        var re = /:(\w+)/g;
        var paramMatched = re.exec(mask);
        while (paramMatched) {
            cb({
                prefixEnd: paramMatched.index,
                suffixStart: paramMatched.index + paramMatched[0].length,
                name: paramMatched[1]
            });
            paramMatched = re.exec(mask);
        }
    }
    function _getUrlParams(params) {
        var res = {};
        params.forEach(function (param) {
            res[param.name] = param.urlValue === undefined ? undefined : decodeURIComponent(param.urlValue);
        });
        return res;
    }
    function _getCfgParams(params) {
        var res = {};
        params.forEach(function (param) {
            res[param.name] = param.value;
        });
        return res;
    }
    function _resolveHref(href, mask, cfg) {
        var params = _calculateParams(mask, cfg);
        var cfgParams = _getCfgParams(params);
        var urlParams = _getUrlParams(params);
        var toFind = _resolveMask(mask, urlParams);
        var toReplace = _resolveMask(mask, cfgParams);
        var result = href;
        if (toReplace && toReplace[0] === '/') {
            result = toReplace;
        } else if (toFind) {
            if (toReplace) {
                result = href.replace(toFind, toReplace);
            } else {
                if (href.indexOf('/' + toFind) !== -1) {
                    result = href.replace('/' + toFind, '');
                } else if (href.indexOf('?' + toFind) !== -1) {
                    var hasOtherParams = href.indexOf('?' + toFind + '&') !== -1;
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
            var qIndex = href.indexOf('?');
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
    function _resolveMask(mask, params) {
        var paramCount = 0, resolvedCount = 0;
        _matchParams(mask, function (param) {
            paramCount++;
            if (params[param.name] !== undefined) {
                var paramValue = params[param.name];
                if (typeof paramValue !== 'string') {
                    paramValue = JSON.stringify(paramValue);
                }
                paramValue = encodeURIComponent(paramValue);
                mask = mask.replace(':' + param.name, paramValue);
                resolvedCount++;
            }
        });
        var result = '';
        if (resolvedCount === paramCount) {
            result = mask;
        }
        return result;
    }    // Adds a forward slash to the end of href if it doesn't end
         // with a slash already
    // Adds a forward slash to the end of href if it doesn't end
    // with a slash already
    function _appendSlash(href) {
        if (href[href.length - 1] === '/') {
            return href;
        } else {
            return href + '/';
        }
    }
    function _getFolderNameByUrl(url) {
        var folderName = url || '';    // Folder name for url '/sign_in?return=mainpage' should be 'sign_in'
        // Folder name for url '/sign_in?return=mainpage' should be 'sign_in'
        if (folderName.indexOf('?') !== -1) {
            folderName = folderName.replace(/\?.*/, '');
        }    // Folder name for url '/news#group=testGroup' should be 'news'
        // Folder name for url '/news#group=testGroup' should be 'news'
        if (folderName.indexOf('#') !== -1) {
            folderName = folderName.replace(/#.*/, '');
        }    // Folder name for '/Tasks/onMe' is 'Tasks', but folder name for
             // 'tasks.html' is 'tasks.html'
        // Folder name for '/Tasks/onMe' is 'Tasks', but folder name for
        // 'tasks.html' is 'tasks.html'
        if (folderName.indexOf('/') !== -1) {
            folderName = folderName.split('/')[1];
        }
        return folderName;
    }
});