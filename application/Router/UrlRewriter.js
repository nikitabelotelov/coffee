/// <amd-module name="Router/UrlRewriter" />
define('Router/UrlRewriter', [
    'require',
    'exports',
    'router'
], function (require, exports, replacementRoutes) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var httpRE = /^http[s]?:\/\//;
    var startSlash = /^\//;
    var finishSlash = /\/$/;    // tree of paths
    // tree of paths
    var routeTree;    // main route
    // main route
    var rootRoute;
    _prepareRoutes(replacementRoutes || {});    // get url using rewriting by rules from router.json
    // get url using rewriting by rules from router.json
    function get(originalUrl) {
        var _a = _splitQueryAndHash(originalUrl), path = _a.path, misc = _a.misc;
        if (path === '/' && rootRoute) {
            return rootRoute + misc;
        }
        if (routeTree) {
            var urlPatched = _getPath(path);
            var urlArr = urlPatched.split('/');
            var curTreePoint = routeTree.tree;
            var found = null;
            var foundIndex = null;
            for (var i = 0; i < urlArr.length; i++) {
                var urlPart = urlArr[i];
                if (!curTreePoint[urlPart]) {
                    break;
                }
                if (curTreePoint[urlPart].value) {
                    // it's found path what can be used for rewriting
                    // but we must continue process of finding most long matching path
                    found = curTreePoint[urlPart].value;
                    foundIndex = i;
                }
                curTreePoint = curTreePoint[urlPart].tree;
            }
            if (found) {
                var prefix = urlArr.slice(0, foundIndex + 1).join('/');
                var result = path.replace(prefix, found);
                return result + misc;
            }
        }
        return path + misc;
    }
    exports.get = get;
    function _splitQueryAndHash(url) {
        var splitMatch = url.match(/[?#]/);
        if (splitMatch) {
            var index = splitMatch.index;
            return {
                path: url.substring(0, index),
                misc: url.slice(index)
            };
        }
        return {
            path: url,
            misc: ''
        };
    }    // get path by url and normalize it
    // get path by url and normalize it
    function _getPath(url) {
        url = url.replace(httpRE, '');
        var qIndex = url.indexOf('?');
        var pIndex = url.indexOf('#');
        if (qIndex !== -1) {
            url = url.slice(0, qIndex);
        }
        if (pIndex !== -1) {
            url = url.slice(0, pIndex);
        }
        url = url.replace(startSlash, '').replace(finishSlash, '');
        return url;
    }    // prepare data structure for quick access to it
         // exported for unit tests
    // prepare data structure for quick access to it
    // exported for unit tests
    function _prepareRoutes(json) {
        routeTree = {
            value: null,
            tree: {}
        };
        rootRoute = null;
        if (!json) {
            return;
        }
        if (json.hasOwnProperty('/')) {
            rootRoute = '/' + _getPath(json['/']);
        }
        for (var routeName in json) {
            if (json.hasOwnProperty(routeName)) {
                if (routeName === '/') {
                    continue;
                }
                var routeDest = json[routeName];
                routeName = _getPath(routeName);
                var routeNameArr = routeName.split('/');
                var curTreePoint = routeTree.tree;
                for (var i = 0; i < routeNameArr.length; i++) {
                    var routeNamePart = routeNameArr[i];
                    if (!curTreePoint.hasOwnProperty(routeNamePart)) {
                        curTreePoint[routeNamePart] = {
                            value: null,
                            tree: {}
                        };
                    }
                    if (routeNameArr.length - 1 === i) {
                        curTreePoint[routeNamePart].value = routeDest;
                    }
                    curTreePoint = curTreePoint[routeNamePart].tree;
                }
            }
        }
    }
    exports._prepareRoutes = _prepareRoutes;
});