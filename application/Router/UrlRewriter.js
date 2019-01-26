define('Router/UrlRewriter', [
    'require',
    'exports'
], function (require, exports) {
    /// <amd-module name="Router/UrlRewriter" />
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var httpRE = /^http[s]?:\/\//;
    var startSlash = /^\//;
    var finishSlash = /\/$/;    // tree of paths
    // tree of paths
    var routeTree;    // main route
    // main route
    var rootRoute;    // get path by url and normalize it
    // get path by url and normalize it
    function getPath(url) {
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
    // prepare data structure for quick access to it
    function prepare(json) {
        routeTree = {
            value: null,
            tree: {}
        };
        rootRoute = null;
        if (!json) {
            return;
        }
        if (json.hasOwnProperty('/')) {
            rootRoute = '/' + getPath(json['/']);
        }
        for (var routeName in json) {
            if (json.hasOwnProperty(routeName)) {
                if (routeName === '/') {
                    continue;
                }
                var routeDest = json[routeName];
                routeName = getPath(routeName);
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
    }    // get url using rewriting by rules from router.json
    // get url using rewriting by rules from router.json
    function get(url) {
        if (url === '/' && rootRoute) {
            return rootRoute;
        }
        if (routeTree) {
            var urlPatched = getPath(url);
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
                var result = url.replace(prefix, found);
                return result;
            }
        }
        return url;
    }
    var rewriter = {
        get: get,
        _prepare: prepare
    };
    exports.default = rewriter;
});