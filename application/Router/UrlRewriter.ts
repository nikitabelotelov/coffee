/// <amd-module name="Router/UrlRewriter" />
"use strict";

const httpRE = /^http[s]?:\/\//;
const startSlash = /^\//;
const finishSlash = /\/$/;

// tree of paths
let routeTree;
// main route
let rootRoute;

// get path by url and normalize it
function getPath(url) {
   url = url.replace(httpRE, '');
   const qIndex = url.indexOf('?');
   const pIndex = url.indexOf('#');
   if (qIndex !== -1) {
      url = url.slice(0, qIndex);
   }
   if (pIndex !== -1) {
      url = url.slice(0, pIndex);
   }
   url = url.replace(startSlash, '').replace(finishSlash, '');
   return url;
}

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

   for (let routeName in json) {
      if (json.hasOwnProperty(routeName)) {
         if (routeName === '/') {
            continue;
         }

         const routeDest = json[routeName];

         routeName = getPath(routeName);

         const routeNameArr = routeName.split('/');

         let curTreePoint = routeTree.tree;

         for (let i = 0; i < routeNameArr.length; i++) {
            const routeNamePart = routeNameArr[i];

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

// get url using rewriting by rules from router.json
function get(url) {
   if (url === '/' && rootRoute) {
      return rootRoute;
   }
   if (routeTree) {
      const urlPatched = getPath(url);
      const urlArr = urlPatched.split('/');

      let curTreePoint = routeTree.tree;
      let found = null;
      let foundIndex = null;

      for (let i = 0; i < urlArr.length; i++) {
         const urlPart = urlArr[i];

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
         const prefix = urlArr.slice(0, foundIndex + 1).join('/');
         const result = url.replace(prefix, found);
         return result;
      }
   }
   return url;
}

const rewriter = {
   get: get,
   _prepare: prepare
};

export default rewriter;