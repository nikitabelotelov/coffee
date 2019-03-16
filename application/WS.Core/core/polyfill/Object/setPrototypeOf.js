/* eslint-disable no-proto */
if (!Object.setPrototypeOf) {
   Object.defineProperty(Object, 'setPrototypeOf', {
      value: ({ __proto__: [] } instanceof Array && function setPrototypeOf(obj, prototype) {
         obj.__proto__ = prototype;
         return obj;
      }) || function setPrototypeOf(obj, prototype) {
         //This fix only for code created by Babel compiler which count on __proto__ property
         obj.__proto__ = prototype;

         for (var p in prototype) {
            if (prototype.hasOwnProperty(p)) {
               obj[p] = prototype[p];
            }
         }
         return obj;
      },
      writable: true,
      configurable: true
   });
}
