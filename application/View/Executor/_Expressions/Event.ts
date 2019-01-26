/// <amd-module name="View/Executor/_Expressions/Event" />

const originDOMEventNames = {
   mozmousepixelscroll: "MozMousePixelScroll"
};

export function isEvent(titleAttribute) {
   return /^(on:[A-z0-9])\w*$/.test(titleAttribute);
}

export function getEventName(eventAttribute) {
   return eventAttribute.slice(3).toLowerCase();
}

export function fixUppercaseDOMEventName(name) {
   var fixedName = originDOMEventNames[name];
   return fixedName || name;
}
