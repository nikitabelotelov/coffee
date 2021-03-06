define('Core/nativeExtensions/Function', [
   'Core/nativeExtensions/deprecated',
   'Core/helpers/Function/debounce',
   'Core/helpers/Function/throttle',
   'Core/helpers/Function/callAround',
   'Core/helpers/Function/callBefore',
   'Core/helpers/Function/callBeforeWithCondition',
   'Core/helpers/Function/callNext',
   'Core/helpers/Function/callNextWithCondition',
   'Core/helpers/Function/callIf',
   'Core/helpers/Function/once'
], function(
   deprecated,
   debounce,
   throttle,
   callAround,
   callBefore,
   callBeforeWithCondition,
   callNext,
   callNextWithCondition,
   callIf,
   once
) {
   Function.prototype.debounce = deprecated('Function.prototype.debounce', 'Core/helpers/Function/debounce', debounce);
   Function.prototype.throttle = deprecated('Function.prototype.throttle', 'Core/helpers/Function/throttle', throttle);
   Function.prototype.callAround = deprecated('Function.prototype.callAround', 'Core/helpers/Function/callAround', callAround);
   Function.prototype.callBefore = deprecated('Function.prototype.callBefore', 'Core/helpers/Function/callBefore', callBefore);
   Function.prototype.callBeforeWithCondition = deprecated('Function.prototype.callBeforeWithCondition', 'Core/helpers/Function/callBeforeWithCondition', callBeforeWithCondition);
   Function.prototype.callNext = deprecated('Function.prototype.callNext', 'Core/helpers/Function/callNext', callNext);
   Function.prototype.callNextWithCondition = deprecated('Function.prototype.callNextWithCondition', 'Core/helpers/Function/callNextWithCondition', callNextWithCondition);
   Function.prototype.callIf = deprecated('Function.prototype.callIf', 'Core/helpers/Function/callIf', callIf);
   Function.prototype.once = deprecated('Function.prototype.once', 'Core/helpers/Function/once', once);

   return {
      debounce: debounce,
      throttle: throttle,
      callAround: callAround,
      callBefore: callBefore,
      callBeforeWithCondition: callBeforeWithCondition,
      callNext: callNext,
      callNextWithCondition: callNextWithCondition,
      callIf: callIf,
      once: once
   };
});
