/// <amd-module name="Vdom/_private/Synchronizer/resources/SwipeController" />
define('Vdom/_private/Synchronizer/resources/SwipeController', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var swipeState;
    function resetSwipeState() {
        swipeState = {
            minSwipeDistance: 50,
            deviationThreshold: 25,
            maxSwipeDuration: 600
        };
    }
    exports.resetSwipeState = resetSwipeState;
    function initSwipeState(event) {
        var location = getTouchLocation(event);
        if (hasSwipeData() || resetSwipeState() || !isSwipe(location)) {
            return;
        }    /// Обработка события
        /// Обработка события
        swipeState.time = Date.now();
        swipeState.location = location;
        swipeState.target = event.target;
    }
    exports.initSwipeState = initSwipeState;
    function isSwipe(location) {
        /// Данная проверка необходима, чтобы не слать событие swipe, когда пользователь переходит по истории страниц
        /// вперед/назад свайпом - на это событие реагирует браузер. Отличительная черта такого события - swipe начинается
        /// на границах экрана по X.
        return location.x - swipeState.deviationThreshold >= 0 && location.x + swipeState.deviationThreshold <= window.innerWidth;
    }
    function hasSwipeData() {
        return swipeState && swipeState.target;
    }
    function getTouchLocation(event) {
        var data = event.touches ? event.touches[0] : event;
        return {
            x: data.clientX,
            y: data.clientY
        };
    }
    function detectSwipeDirection(event) {
        var currentTime = Date.now();
        var location = getTouchLocation(event);
        var direction;
        if (event.target === swipeState.target && swipeState.time - currentTime < swipeState.maxSwipeDuration) {
            if (Math.abs(swipeState.location.x - location.x) > swipeState.minSwipeDistance && Math.abs(swipeState.location.y - location.y) < swipeState.deviationThreshold) {
                direction = swipeState.location.x > location.x ? 'left' : 'right';
            } else if (Math.abs(swipeState.location.y - location.y) > swipeState.minSwipeDistance && Math.abs(swipeState.location.x - location.x) < swipeState.deviationThreshold) {
                direction = swipeState.location.y > location.y ? 'top' : 'bottom';
            }
        }
        return direction;
    }
    function detectSwipe(event) {
        if (swipeState.target) {
            var swipeDirection = detectSwipeDirection(event);
            if (swipeDirection) {
                var swipe = new Event('swipe');
                swipe.direction = swipeDirection;
                event.target.dispatchEvent(swipe);
                resetSwipeState();
            }
        }
    }
    exports.detectSwipe = detectSwipe;
});