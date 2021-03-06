/// <amd-module name="Vdom/_private/Synchronizer/resources/SyntheticEvent" />

/**
 * Перехватываем события дома на этапе всплытия и поэтому далее сами
 * должны правильно распространить их
 * Некоторые события не всплывают (флаги взяты из документации)
 * */
var domEventsBubbling = {
   animationend: true,
   blur: false,
   error: false,
   focus: false,
   load: false,
   mouseenter: false,
   mouseleave: false,
   resize: false,
   scroll: false,
   unload: false,
   click: true,
   change: true,
   compositionend: true,
   compositionstart: true,
   compositionupdate: true,
   copy: true,
   cut: true,
   paste: true,
   dblclick: true,
   focusin: true,
   focusout: true,
   input: true,
   keydown: true,
   keypress: true,
   keyup: true,
   mousedown: true,
   mousemove: true,
   mouseout: true,
   mouseover: true,
   mouseup: true,
   select: true,
   wheel: true,
   touchstart: true,
   touchend: true,
   touchmove: true,
   contextmenu: true,
   swipe: true
};

export default function SyntheticEvent(nativeEvent, eventConfig?) {
   var config = nativeEvent ? nativeEvent : eventConfig;

   this.nativeEvent = nativeEvent ? nativeEvent : null;
   this.type = config.type;
   this.target = config.target;
   this._bubbling = nativeEvent ? domEventsBubbling[config.type] : eventConfig && eventConfig._bubbling;
   this.stopped = false;
}

var proto = SyntheticEvent.prototype;

proto.stopPropagation = function () {
   this.stopped = true;
   if (this.nativeEvent) {
      this.nativeEvent.stopPropagation();
   }
};

proto.isStopped = function () {
   return this.stopped;
};

proto.isBubbling = function () {
   return this._bubbling;
};

proto.preventDefault = function () {
   if (this.nativeEvent) {
      this.nativeEvent.preventDefault();
   }
};

/**
 * Возвращает true, если событие нужно распространять далее
 * @returns {boolean}
 */
proto.propagating = function () {
   return this._bubbling === true && this.stopped === false;
};

proto.stopImmediatePropagation = function () {
   this.stopPropagation();
};
