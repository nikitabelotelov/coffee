define('Browser/_Event/Server/StompTest/StompTest.routes', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';    // @ts-ignore
    // @ts-ignore
    module.exports = function () {
        return {
            '/ws/lib/ServerEventBus/stomp_test.html': function (req, res) {
                res.render('Lib/ServerEvent/StompTest/StompTest', {});
            }
        };
    };
});