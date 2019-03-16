define('Env/_Env/detection', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';    /// <amd-module name="Env/_Env/detection" />
                     // tslint:disable:cyclomatic-complexity
    /// <amd-module name="Env/_Env/detection" />
    // tslint:disable:cyclomatic-complexity
    function IEVersion(userAgent) {
        var ua = userAgent.toString().toLowerCase() || '';
        var match = /(msie)\s+([\w.]+)/.exec(ua) || /(trident)(?:.*rv:([\w.]+))?/.exec(ua) || /(edge)\/([\w]+)/.exec(ua);
        return match && parseInt(match[2], 10);
    }
    function IOSVersion(userAgent) {
        var match = /\bCPU\s+(i?)OS\s+(\d+)/.exec(userAgent);
        return match && parseInt(match[2], 10);
    }    /**
     * Get WebKit major version from User Agent string.
     *
     * @param userAgent: string
     * @returns number
     */
    /**
     * Get WebKit major version from User Agent string.
     *
     * @param userAgent: string
     * @returns number
     */
    function getWebkitVersion(userAgent) {
        var match = /(AppleWebKit\/)+([\w.]+)/.exec(userAgent);
        return match && parseInt(match[2], 10);
    }    /**
     * Get Safari major version number from User Agent string.
     *
     * @param userAgent: string
     * @returns number
     */
    /**
     * Get Safari major version number from User Agent string.
     *
     * @param userAgent: string
     * @returns number
     */
    function getSafariVersion(userAgent) {
        var match = /(Safari\/)+([\w.]+)/.exec(userAgent);
        return match && parseInt(match[2], 10);
    }
    function getUserAgent() {
        var agent = '';    // @ts-ignore
        // @ts-ignore
        if (typeof process !== 'undefined') {
            // node
            // @ts-ignore
            var req = process.domain && process.domain.req;
            agent = req && req.headers && req.headers['user-agent'] ? req.headers['user-agent'] : '';
        } else if (typeof navigator !== 'undefined') {
            // browser
            agent = navigator.userAgent;
        }
        return agent;
    }
    function getTrident(userAgent) {
        var match = userAgent.match(/Trident\/(\d+)/);
        return match && parseInt(match[1], 10);
    }
    function isNotFullGridSupport(userAgent, isBaseSupport) {
        if (!!IEVersion(userAgent)) {
            return true;
        }
        if (/Chrome\/[0-9]*./.test(userAgent)) {
            //grid-layout is supported from version 57, display contents starting at version 65.
            return parseInt(userAgent.match(/Chrome\/[0-9]*./)[0].substr(7, 8), 10) < (isBaseSupport ? 57 : 65);
        }
        if (/Version\/[0-9]*.[0-9].[0-9] Safari/.test(userAgent)) {
            if (isBaseSupport) {
                var matchWithPath = /Version\/(\d+).(\d+).(\d+) Safari/.exec(userAgent);    //Additionally, we check the version without the patch, for example 12.0
                //Additionally, we check the version without the patch, for example 12.0
                var matchWithoutPath = /Version\/(\d+).(\d+) Safari/.exec(userAgent);
                var math = matchWithPath || matchWithoutPath;
                return math && parseInt(math[1], 10) < 12;
            } else {
                //display contents not supported in safari. https://bugs.webkit.org/show_bug.cgi?id=181640
                return true;
            }
        }
        if (/(iPod|iPhone|iPad)/.test(userAgent)) {
            var match = /\bCPU\s+((iPhone OS)|(i?OS)) ((\d|_)*)/.exec(userAgent);
            if (!match || !match[4]) {
                return false;
            }
            var version = match[4].split('_').map(function (item) {
                return parseInt(item, 10);
            });    //grid-layout is supported from version 10.3, display contents starting at version 11.4.
            //grid-layout is supported from version 10.3, display contents starting at version 11.4.
            if (isBaseSupport) {
                return version[0] < 10 || version[0] === 10 && version[1] < 3;
            } else {
                return version[0] < 11 || version[0] === 11 && version[1] < 4;
            }
        }
        return false;
    }
    function recalcDetection(testUserAgent) {
        var userAgent = testUserAgent || getUserAgent(), isIOSMobilePlatform = !!/(iPod|iPhone|iPad)/.test(userAgent),
            /**
         * На таблетках нет Mobile в UA
         * @link https://developer.chrome.com/multidevice/user-agent
         */
            ieVersion = IEVersion(userAgent), iosVersion = IOSVersion(userAgent), isAndroidMobilePlatform = !!(/Android/.test(userAgent) && /AppleWebKit/.test(userAgent)),
            // У Microsoft Lumia 550 в user agent может не быть упоминаний Windows Phone, пример в https://online.sbis.ru/opendoc.html?guid=b698ee18-2e51-473c-9537-2793a63e080f
            isWPMobilePlatform = /Windows Phone/i.test(userAgent) || /iemobile/i.test(userAgent) || /WPDesktop/i.test(userAgent) || /Lumia/i.test(userAgent), isMacOSPlatform = !!/\bMac\s+OS\s+X\b/.test(userAgent) && !isIOSMobilePlatform, isChromeIOS = !!(isIOSMobilePlatform && userAgent.match(/\bCriOS\b/)), isChromeDesktop = (!!(typeof window !== 'undefined' && window.chrome) || isChromeIOS) && !ieVersion, isMobilePlatform = isIOSMobilePlatform || isAndroidMobilePlatform || isWPMobilePlatform, isMobileSafari = isIOSMobilePlatform && !isChromeIOS && /AppleWebKit/.test(userAgent) && /Mobile\//.test(userAgent), isWebkit = !isChromeDesktop && /(webkit)/i.test(userAgent) && !(ieVersion && ieVersion >= 12), isDesktopSafari = isMacOSPlatform && /AppleWebKit/.test(userAgent) && !/Chrome/.test(userAgent), isSafari = isMobileSafari || isDesktopSafari, isOldWebkit = isChromeIOS && iosVersion < 11 || isSafari && getSafariVersion(userAgent) < 604, win = /Windows/i.test(userAgent), win10 = /Windows NT 10\.0/i.test(userAgent), win8 = /Windows NT 6\.[23]/i.test(userAgent), win7 = /Windows NT 6\.1/i.test(userAgent), winVista = /Windows NT 6\.0/i.test(userAgent), winXP = /Windows NT 5\.[12]/i.test(userAgent), unix = /(?:unix|linux)/i.test(userAgent), mac = /Macintosh/i.test(userAgent);
        var safariVersion = isSafari && userAgent.match(/Version\/([0-9\.]*)/);    // @ts-ignore
        // @ts-ignore
        safariVersion = safariVersion instanceof Array ? parseInt(safariVersion[1], 10) : safariVersion;
        var detection = {
            userAgent: userAgent,
            isWPMobilePlatform: isWPMobilePlatform,
            /**
             * Мобильный сафари - iPhone, iPod, iPad
             */
            isMobileSafari: isMobileSafari,
            /**
             * Мобильные версии браузеров на андроиде
             */
            isMobileAndroid: isAndroidMobilePlatform,
            /**
             * Мобильные версии браузеров на IOS
             */
            isMobileIOS: isIOSMobilePlatform,
            /**
             * Мобильные версии браузеров
             */
            isMobilePlatform: isMobilePlatform,
            /**
             * internet explorer
             */
            isIE: !!ieVersion,
            /**
             * internet explorer 10+
             */
            isModernIE: ieVersion > 9,
            /**
             * internet explorer 10
             */
            isIE10: ieVersion === 10,
            isRealIE10: ieVersion === 10 && getTrident(userAgent) === 6,
            /**
             * internet explorer 11
             */
            isIE11: ieVersion === 11,
            /**
             * internet explorer 12 (EDGE)
             */
            isIE12: ieVersion >= 12,
            IEVersion: ieVersion,
            IOSVersion: iosVersion,
            isOldWebKit: isOldWebkit,
            /**
             * Firefox
             */
            firefox: userAgent.indexOf('Firefox') > -1,
            /**
             * Chrome
             */
            chrome: isChromeDesktop || isChromeIOS,
            /**
             * Old Chrome and Safari without full grid layout and display:contents support
             */
            isNotFullGridSupport: isNotFullGridSupport(userAgent, false),
            /**
             * Old Chrome and Safari and IE without grid layout support
             */
            isNotGridSupport: isNotFullGridSupport(userAgent, true),
            /**
             * Mac OS
             */
            isMacOSDesktop: isMacOSPlatform && !isIOSMobilePlatform,
            /**
             * Mac OS
             */
            isMacOSMobile: isMacOSPlatform && isIOSMobilePlatform,
            /*
             * Safari
             */
            safari: /^((?!chrome|android).)*safari/i.test(userAgent),
            // @ts-ignore
            safari11: isSafari && safariVersion === 11,
            opera: /(opera)/i.test(userAgent),
            operaChrome: /OPR/.test(userAgent),
            /*
             * Yandex
             */
            yandex: /\bYaBrowser\/(\d+)/.test(userAgent),
            // в Edge User-Agent содержит 'AppleWebKit' поэтому он определяется как webkit, хотя не должен
            webkit: isWebkit,
            retailOffline: userAgent.indexOf('sbis') > -1,
            isWin: win,
            isWin10: win10,
            isWin8: win8,
            isWin7: win7,
            isWinVista: winVista,
            isWinXP: winXP,
            isUnix: unix,
            isMac: mac
        };
        return detection;
    }
    var detection;    /**
     * На сервере detection не должен кешиться и каждый запрос к нему должен пересчитываться заново
     * на клиенте эта логика не нужна, поскольку браузер статичен
     */
    /**
     * На сервере detection не должен кешиться и каждый запрос к нему должен пересчитываться заново
     * на клиенте эта логика не нужна, поскольку браузер статичен
     */
    if (typeof window === 'undefined') {
        /**
         * Позволяет установить userAgent при тестировании под Node
         * ```
         *  Env.detection.testUserAgent = 'custom user agent';
         * ```
         */
        var testUserAgent_1 = null;
        detection = new Proxy({}, {
            set: function (target, property, value) {
                if (property === 'testUserAgent') {
                    testUserAgent_1 = value;
                    return true;
                }
            },
            get: function (target, property) {
                return recalcDetection(testUserAgent_1)[property];
            }
        });
    } else {
        detection = recalcDetection(null);
    }
    return detection;
});