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
        if (!swipeState || !swipeState.target) {
            resetSwipeState();
            swipeState.time = Date.now();
            swipeState.location = getTouchLocation(event);
            swipeState.target = event.target;
        }
    }
    exports.initSwipeState = initSwipeState;
    function getTouchLocation(event) {
        var data = event.touches ? event.touches[0] : event;
        return {
            x: data.clientX,
            y: data.clientY
        };
    }
    function detectSwipeDirection(event) {
        var location = getTouchLocation(event), direction;
        if (event.target === swipeState.target && swipeState.time - Date.now() < swipeState.maxSwipeDuration) {
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