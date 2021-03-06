define('Core/helpers/Hcontrol/focusControl', [
    'Core/helpers/Hcontrol/isScrollable',
    'Core/helpers/Hcontrol/hasScrollbar',
    'Vdom/Vdom'
], function (isScrollable, hasScrollbar, Vdom) {
    /**
    * Модуль, в котором описана функция <b>focusControl(control)</b>.
    *
    * @class Core/helpers/Hcontrol/focusControl
    * @public
    * @author Шипин А.А.
    */

    var win;
    function getWindow() {
        return win || (win = $(window));
    }

    return function (control) {
        function isScrollableOrFixed(nodeType, el) {
            return nodeType === 1 &&
                (el.css('position') === 'fixed' ||
                el.is('.ws-scrolling-content') ||
                ((isScrollable(el, 'y') && hasScrollbar(el, 'y'))));
        }

        function findScrollable(el) {
            if (el.length === 0) { //если элемент пустой, то это конец иеарархии "оторванного" фрагмента документа. там не надо ничего прокручивать
                return $(null);//даст jquery-элемент, у которого size()=0
            } else {
                var nodeType = el.prop('nodeType');
                if (nodeType === 9) { //Если дошли до документа, то отдать его владельца - window. будем запоминать и восстанавливать его прокрутку
                    return $(el.prop('defaultView') || el.prop('parentWindow'));//parentWindow - для IE8
                }
                else if (isScrollableOrFixed(nodeType, el)) {
                    //нашли родительский элемент с прокруткой (или фиксированный). будем запоминать и восстанавливать scrollTop у него.
                    //нужно искать ещё и фикс. элементы, потому что блок содержимого (#contentArea) может фиксироваться левым аккордеоном, и тогда прокрутку надо
                    //запоминать и восстанавливать у него
                    return el;
                } else {
                    return findScrollable(el.parent());
                }
            }
        }

       function findEnvironment(component) {
          while (component) {
              var environment = component._getEnvironment();
             if (environment) {
                return environment;
             }
             component = component._logicParent;
          }
          throw new Error('environment не был найден среди предков');
       }

        if (!control.isDestroyed() && control._needFocusOnActivated() && control.isVisibleWithParents()) {
            var toFocus = control._getElementToFocus(), scrollable, scrollTop, newScrollTop;

            if (toFocus && toFocus.focus && document.activeElement !== toFocus.get(0)) {
                scrollable = findScrollable(toFocus.parent());
                if (scrollable.length > 0) {
                    //В случае body прокрутка на самом деле находится в window - у него и надо будет её запоминать и восстанавливать
                    if (!$.isWindow(scrollable.get(0)) && scrollable.is('body, html')) {
                        scrollable = getWindow();
                    }

                    scrollTop = scrollable.scrollTop();
                    try {
                        control._ignoreNativeFocusIn = true;
                        if (control.iWantVDOM && findEnvironment(control)._haveRebuildRequest) {
                            control.__$focusing = true;
                        } else {
                            Vdom.Focus.focus(toFocus.get(0));
                        }
                    } finally {
                        control._ignoreNativeFocusIn = false;
                    }

                    newScrollTop = scrollable.scrollTop();
                    if (newScrollTop !== scrollTop) {
                        scrollable.scrollTop(scrollTop);
                    }
                }
            }
        }
    };

});
