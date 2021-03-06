define('Core/polyfill', (function() {
   var IS_SERVER_SIDE = typeof window === 'undefined';
   var polyfills = [];

   if (IS_SERVER_SIDE || !Function.prototype.bind) {
      polyfills.push('Core/polyfill/Function/bind');
   }
   if (!Object.getPrototypeOf) {
      polyfills.push('Core/polyfill/Object/getPrototypeOf');
   }
   if (!Object.setPrototypeOf) {
      polyfills.push('Core/polyfill/Object/setPrototypeOf');
   }
   if (IS_SERVER_SIDE || !Object.keys) {
      polyfills.push('Core/polyfill/Object/keys');
   }
   if (IS_SERVER_SIDE || !Object.create) {
      polyfills.push('Core/polyfill/Object/create');
   }
   if (IS_SERVER_SIDE || !Object.assign) {
      polyfills.push('Core/polyfill/Object/assign');
   }
   if (IS_SERVER_SIDE || !Array.isArray) {
      polyfills.push('Core/polyfill/Array/isArray');
   }
   if (!Array.prototype.find) {
      polyfills.push('Core/polyfill/Array/find');
   }
   if (!Array.prototype.includes) {
      polyfills.push('Core/polyfill/Array/includes');
   }
   if (!Array.prototype.findIndex) {
      polyfills.push('Core/polyfill/Array/findIndex');
   }
   if (IS_SERVER_SIDE || !String.fromCodePoint) {
      polyfills.push('Core/polyfill/String/fromCodePoint');
   }
   if (IS_SERVER_SIDE || !String.prototype.startsWith) {
      polyfills.push('Core/polyfill/String/startsWith');
   }
   if (IS_SERVER_SIDE || !String.prototype.trim) {
      polyfills.push('Core/polyfill/String/trim');
   }
   if (IS_SERVER_SIDE || !String.prototype.repeat) {
      polyfills.push('Core/polyfill/String/repeat');
   }
   if (IS_SERVER_SIDE || !Math.trunc) {
      polyfills.push('Core/polyfill/Math/trunc');
   }
   if (typeof Element !== 'undefined' && Element.prototype) {
      if (!Element.prototype.matches) {
         polyfills.push('Core/polyfill/Element/matches');
      }
      if (!Element.prototype.closest) {
         polyfills.push('Core/polyfill/Element/closest');
      }
   }
   if (typeof Promise === 'undefined') {
      polyfills.push('Core/polyfill/Promise');
   }

   if (!Number.isNaN) {
      polyfills.push('Core/polyfill/Number/isNaN');
   }

   if (typeof fetch === 'undefined') {
      polyfills.push('Core/polyfill/fetch');
   }
   if (typeof AbortController === 'undefined') {
      polyfills.push('Core/polyfill/AbortController');
   }
   if (typeof WeakMap === 'undefined') {
      polyfills.push('Core/polyfill/WeakMap');
   }
   return polyfills;
})(), function() {
   return Array.prototype.slice.call(arguments);
});
