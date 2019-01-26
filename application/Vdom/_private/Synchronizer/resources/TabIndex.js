/// <amd-module name="Vdom/_private/Synchronizer/resources/TabIndex" />
define('Vdom/_private/Synchronizer/resources/TabIndex', [
    'require',
    'exports',
    'Vdom/_private/Utils/Functional'
], function (require, exports, Functional_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var NODE_NODE_TYPE = 1;
    var FOCUSABLE_ELEMENTS = {
            a: true,
            link: true,
            button: true,
            input: true,
            select: true,
            textarea: true
        }, CLASS_HIDDEN_FLAG = 1, CLASS_DISABLED_FLAG = 2, CLASS_DELEGATES_TAB_FLAG = 4, CLASS_CREATES_CONTEXT = 8, CLASS_TAB_CYCLING = 16, CLASS_NAME_TO_FLAG = {
            hidden: CLASS_HIDDEN_FLAG,
            disabled: CLASS_DISABLED_FLAG,
            'delegates-tabfocus': CLASS_DELEGATES_TAB_FLAG,
            'creates-context': CLASS_CREATES_CONTEXT,
            'tab-cycling': CLASS_TAB_CYCLING
        };
    function getStyle(element, style) {
        return window.getComputedStyle(element)[style];
    }
    function getElementProps(element) {
        var elementPropsClassRe = /\bws-(hidden|disabled)\b/g, className = element.getAttribute('class'), classes, tabIndex, tabIndexAttr, validTabIndex, flags, enabled, result;
        flags = 0;
        while (classes = className && elementPropsClassRe.exec(className)) {
            flags |= CLASS_NAME_TO_FLAG[classes[1]];
        }    // todo совместимость! когда уберем совместимость, надо убрать element.getAttribute('ws-creates-context')
        // todo совместимость! когда уберем совместимость, надо убрать element.getAttribute('ws-creates-context')
        if (element['ws-creates-context'] === 'true' || element.getAttribute('ws-creates-context') === 'true') {
            flags |= CLASS_NAME_TO_FLAG['creates-context'];
        }
        if (element['ws-delegates-tabfocus'] === 'true' || element.getAttribute('ws-delegates-tabfocus') === 'true') {
            flags |= CLASS_NAME_TO_FLAG['delegates-tabfocus'];
        }
        if (element['ws-tab-cycling'] === 'true' || element.getAttribute('ws-tab-cycling') === 'true') {
            flags |= CLASS_NAME_TO_FLAG['tab-cycling'];
        }
        enabled = (flags & (CLASS_HIDDEN_FLAG | CLASS_DISABLED_FLAG)) === 0;
        if (enabled) {
            enabled = getStyle(element, 'display') !== 'none' && getStyle(element, 'visibility') !== 'invisible';
        }
        if (enabled) {
            tabIndexAttr = element.getAttribute('tabindex');
            tabIndex = parseInt(tabIndexAttr, 10);
            validTabIndex = !isNaN(tabIndex);
            result = {
                enabled: true,
                tabStop: validTabIndex && tabIndex >= 0 || tabIndexAttr === null && FOCUSABLE_ELEMENTS.hasOwnProperty(element.tagName.toLowerCase()) || tabIndex !== -1 && element.hasAttribute('contenteditable'),
                createsContext: (flags & CLASS_CREATES_CONTEXT) !== 0,
                tabIndex: tabIndex || 0,
                delegateFocusToChildren: (flags & CLASS_DELEGATES_TAB_FLAG) !== 0,
                tabCycling: (flags & CLASS_TAB_CYCLING) !== 0
            };
        } else {
            result = {
                enabled: false,
                tabStop: false,
                createsContext: false,
                tabIndex: 0,
                delegateFocusToChildren: false,
                tabCycling: false
            };
        }
        return result;
    }
    exports.getElementProps = getElementProps;
    function firstElementChild(element) {
        return element.firstElementChild && element.firstElementChild.className !== 'vdom-focus-in' ? element.firstElementChild : element.firstElementChild && element.firstElementChild.nextElementSibling && element.firstElementChild.nextElementSibling.className !== 'vdom-focus-out' ? element.firstElementChild.nextElementSibling : null;
    }
    function lastElementChild(element) {
        return element.lastElementChild && element.lastElementChild.className !== 'vdom-focus-out' ? element.lastElementChild : element.lastElementChild && element.lastElementChild.previousElementSibling && element.lastElementChild.previousElementSibling.className !== 'vdom-focus-in' ? element.lastElementChild.previousElementSibling : null;
    }
    function previousElementSibling(element) {
        return element.previousElementSibling ? element.previousElementSibling : null;
    }
    function nextElementSibling(element) {
        return element.nextElementSibling ? element.nextElementSibling : null;
    }    /**
     * Обходит DOM, обход осуществляется в пределах rootElement. При этом если находит элемент, в который может провалиться,
     * проваливается и ищет там.
     */
    /**
     * Обходит DOM, обход осуществляется в пределах rootElement. При этом если находит элемент, в который может провалиться,
     * проваливается и ищет там.
     */
    function find(contextElement, fromElement, fromElementTabIndex, reverse, getElementProps) {
        Functional_1.assert(contextElement && (fromElement || fromElementTabIndex !== undefined) && getElementProps && contextElement !== fromElement);    /**
         * сравнивает табиндексы по величине
         * @param i1
         * @param i2
         * @returns {number}
         * @param reverse
         */
        /**
         * сравнивает табиндексы по величине
         * @param i1
         * @param i2
         * @returns {number}
         * @param reverse
         */
        function compareIndexes(i1, i2, reverse) {
            var res;
            Functional_1.assert(typeof i1 === 'number' && typeof i2 === 'number');
            i1 = i1 === 0 ? Infinity : i1 > 0 ? i1 : -1;
            i2 = i2 === 0 ? Infinity : i2 > 0 ? i2 : -1;
            if (i2 === -1 && i1 !== -1) {
                return 1;
            }
            if (i1 === -1 && i2 !== -1) {
                return -1;
            }
            if (i1 > i2) {
                res = reverse ? -1 : 1;
            } else if (i1 < i2) {
                res = reverse ? 1 : -1;
            } else {
                res = 0;
            }
            return res;
        }
        function findNextElement(element, props, reverse) {
            var stepInto = props.enabled && !props.createsContext, next, parent;
            if (stepInto) {
                next = reverse ? lastElementChild(element) : firstElementChild(element);
            }
            if (!next) {
                next = reverse ? previousElementSibling(element) : nextElementSibling(element);
                if (!next) {
                    parent = element.parentNode;
                    while (parent !== contextElement && !next) {
                        next = reverse ? previousElementSibling(parent) : nextElementSibling(parent);
                        if (!next) {
                            parent = parent.parentNode;
                        }
                    }
                }
            }
            return next || contextElement;
        }
        function findInner(elem) {
            return find(elem, undefined, reverse ? 0 : 1, reverse, getElementProps);
        }
        function startChildElement(parent) {
            return reverse ? lastElementChild(parent) : firstElementChild(parent);
        }
        function canDelegate(next, nextProps) {
            if (nextProps.delegateFocusToChildren && next.childElementCount) {
                if (next.wsControl && next.wsControl.canAcceptFocus && next.wsControl.canAcceptFocus()) {
                    // todo костыль для совместимости, чтобы когда старый компонент внутри нового окружения, он мог принять фокус
                    foundDelegated = next;
                } else {
                    foundDelegated = findInner(next);
                }
            }    // элемент может принять фокус только если он не делегирует внутрь
                 // или сам является фокусируемем элементом (тогда игнорируем флаг делегации внутрь, некуда там делегировать)
                 // или делегирует внутрь и внутри есть что сфокусировать (тогда он делегирует фокус внутрь)
            // элемент может принять фокус только если он не делегирует внутрь
            // или сам является фокусируемем элементом (тогда игнорируем флаг делегации внутрь, некуда там делегировать)
            // или делегирует внутрь и внутри есть что сфокусировать (тогда он делегирует фокус внутрь)
            return !!(!nextProps.delegateFocusToChildren || FOCUSABLE_ELEMENTS.hasOwnProperty(next.tagName.toLowerCase()) || foundDelegated);
        }
        var next, nextProps, stage, result, cmp, props, nearestElement = null, nearestElementStage, nearestTabIndex = null, foundDelegated, savedDelegated;
        if (fromElement) {
            props = getElementProps(fromElement);
            fromElementTabIndex = props.tabIndex;
            next = findNextElement(fromElement, props, reverse);
        } else {
            next = reverse ? lastElementChild(contextElement) : firstElementChild(contextElement);
            next = next || contextElement;
        }
        var startFromFirst = false;
        for (stage = 0; stage !== 2 && !result; stage++) {
            while (next !== contextElement && next !== fromElement && !result) {
                nextProps = getElementProps(next);
                if (nextProps.enabled && nextProps.tabStop) {
                    cmp = compareIndexes(nextProps.tabIndex, fromElementTabIndex, reverse);
                    if (cmp === 0 && stage === 0) {
                        // если индекс совпал, мы уже нашли то что надо
                        if (canDelegate(next, nextProps)) {
                            result = next;
                            savedDelegated = foundDelegated;
                        }
                    } else if (cmp > 0) {
                        //обновляем ближайший, если ti у next больше fromElement.ti, но меньше ti ближайшего
                        if (!result) {
                            // проверяем только если еще нет result
                            if (stage === 0) {
                                if (nearestElement === null || compareIndexes(nextProps.tabIndex, nearestElement.tabIndex, reverse) < 0) {
                                    if (canDelegate(next, nextProps)) {
                                        nearestElement = next;
                                        nearestTabIndex = nextProps.tabIndex;
                                        nearestElementStage = stage;
                                        savedDelegated = foundDelegated;
                                    }
                                }
                            } else {
                                if (nearestElement === null || compareIndexes(nextProps.tabIndex, nearestElement.tabIndex, reverse) < 0 || startFromFirst && compareIndexes(nextProps.tabIndex, nearestElement.tabIndex, reverse) <= 0) {
                                    if (canDelegate(next, nextProps)) {
                                        nearestElement = next;
                                        nearestTabIndex = nextProps.tabIndex;
                                        nearestElementStage = stage;
                                        savedDelegated = foundDelegated;
                                        startFromFirst = false;
                                    }
                                }
                            }
                        }
                    }
                }    // нативно так, если уходим с элемента с табиндексом -1, ищем любой первый элемент https://jsfiddle.net/2v4eq4rn/
                // нативно так, если уходим с элемента с табиндексом -1, ищем любой первый элемент https://jsfiddle.net/2v4eq4rn/
                if (fromElementTabIndex === -1 && nearestElement) {
                    result = nearestElement;
                }
                if (!result) {
                    next = findNextElement(next, nextProps, reverse);    // if (stage === 0 && !next) { // todo ?? findNextElement
                                                                         //    next = contextElement;
                                                                         // }
                }
            }
            // if (stage === 0 && !next) { // todo ?? findNextElement
            //    next = contextElement;
            // }
            if (next === contextElement && stage === 0) {
                //завершение stage=0, элемент не найден
                if (fromElement && (reverse === false && fromElementTabIndex > 0 || reverse === true && fromElementTabIndex !== 1 && fromElementTabIndex !== -1)) {
                    next = startChildElement(contextElement);
                }
            }
            if (stage === 0) {
                startFromFirst = true;
            }
        }
        Functional_1.assert(!!result || next === fromElement || next === contextElement);
        if (!result && nearestElement) {
            // assert(fromElementTabIndex > 0 || (reverse && fromElementTabIndex === 0));
            if (nearestTabIndex >= 0) {
                result = nearestElement;
            }
        }    // ищем подходящий элемент для всех элементов, пока можем проваливаться внутрь нового контекста
        // ищем подходящий элемент для всех элементов, пока можем проваливаться внутрь нового контекста
        if (result && savedDelegated) {
            result = savedDelegated;
            Functional_1.assert(!!result);
        }
        return result;
    }
    function findFirstInContext(contextElement, reverse, getElementProps) {
        return find(contextElement, undefined, reverse ? 0 : 1, reverse, getElementProps);
    }
    exports.findFirstInContext = findFirstInContext;    /**
     * ищем следующий элемент в обходе, с учетом того, что у некоторых элементов может быть свой контекст табиндексов
     */
    /**
     * ищем следующий элемент в обходе, с учетом того, что у некоторых элементов может быть свой контекст табиндексов
     */
    function findWithContexts(rootElement, fromElement, reverse, getElementProps) {
        function getValidatedWithContext(element) {
            var context, lastInvalid = null, validatedElement, parent = element;
            while (parent && parent !== rootElement) {
                if (!getElementProps(parent).enabled) {
                    lastInvalid = parent;
                }
                parent = parent.parentElement;
            }
            if (!parent) {
                throw new Error('Узел fromElement должен лежать внутри узла rootElement');
            }    //ASSERT: !!parent
            //ASSERT: !!parent
            validatedElement = lastInvalid || element;
            if (validatedElement !== rootElement) {
                parent = validatedElement.parentElement;
                while (parent !== rootElement && !getElementProps(parent).createsContext) {
                    parent = parent.parentElement;
                }
                context = parent;
            }
            return {
                element: element,
                context: context    //разрешённый, и лежит в разрешённой иерархии
            };
        }
        //разрешённый, и лежит в разрешённой иерархии
        function checkElement(element, paramName) {
            // разрешаются только рутовые элементы, у которых есть parentElement или они являются  documentElement
            var hasParentElement = element === document.documentElement || !!element.parentElement;
            if (!element || !element.ownerDocument || !hasParentElement || element.nodeType !== NODE_NODE_TYPE) {
                throw new Error('Плохой параметр ' + paramName);
            }
        }
        checkElement(fromElement, 'fromElement');
        checkElement(rootElement, 'rootElement');
        var validated = getValidatedWithContext(fromElement), result = validated.element;
        if (result !== rootElement) {
            do {
                result = find(validated.context, validated.element, undefined, reverse, getElementProps);
                if (!result) {
                    if (getElementProps(validated.context).tabCycling) {
                        break;
                    } else {
                        validated = getValidatedWithContext(validated.context);
                    }
                }
            } while (!result && validated.element !== rootElement);
        }    //прокомментить
        //прокомментить
        if (result === rootElement) {
            result = findFirstInContext(rootElement, reverse, getElementProps);
        }    //прокомментить
        //прокомментить
        if (!result && getElementProps(validated.context || rootElement).tabCycling) {
            result = findFirstInContext(validated.context || rootElement, reverse, getElementProps);
            if (result === undefined) {
                result = fromElement;
            }
        }
        return result;
    }
    exports.findWithContexts = findWithContexts;
    function makeFocusableForeignObject() {
        var fragment = document.createElement('div');
        fragment.innerHTML = '<svg><foreignObject width="30" height="30">' + '<input type="text"/>' + '</foreignObject></svg>';
        return fragment.firstChild.firstChild;
    }
    function focusSvgForeignObjectHack(element) {
        // Edge13, Edge14: foreignObject focus hack
        // https://jsbin.com/kunehinugi/edit?html,js,output
        // https://jsbin.com/fajagi/3/edit?html,js,output
        var isSvgElement = element.ownerSVGElement || element.nodeName.toLowerCase() === 'svg';
        if (!isSvgElement) {
            return false;
        }    // inject and focus an <input> element into the SVG element to receive focus
        // inject and focus an <input> element into the SVG element to receive focus
        var foreignObject = makeFocusableForeignObject();
        element.appendChild(foreignObject);
        var input = foreignObject.querySelector('input');
        input.focus();    // upon disabling the activeElement, IE and Edge
                          // will not shift focus to <body> like all the other
                          // browsers, but instead find the first focusable
                          // ancestor and shift focus to that
        // upon disabling the activeElement, IE and Edge
        // will not shift focus to <body> like all the other
        // browsers, but instead find the first focusable
        // ancestor and shift focus to that
        input.disabled = true;    // clean up
        // clean up
        element.removeChild(foreignObject);
        return true;
    }
    function focus(element) {
        if (element.focus) {
            element.focus();
        }
        try {
            // The element itself does not have a focus method.
            // This is true for SVG elements in Firefox and IE,
            // as well as MathML elements in every browser.
            // IE9 - 11 will let us abuse HTMLElement's focus method,
            // Firefox and Edge will throw an error.
            HTMLElement.prototype.focus.call(element);
        } catch (e) {
            focusSvgForeignObjectHack(element);
        }
    }
    exports.focus = focus;
});