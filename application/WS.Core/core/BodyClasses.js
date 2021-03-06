/**
 * Created by dv.zuev on 31.01.2018.
 */
define('Core/BodyClasses', [
   
   'Env/Env'
], function(
   
   Env
) {
   return function(restrictions) {
      var
         classMap = {
            isIE: 'ws-is-ie',
            isIE10: 'ws-is-ie10',
            isRealIE10: 'ws-is-real-ie10',
            isIE11: 'ws-is-ie11',
            isIE12: 'ws-is-ie12',
            firefox: 'ws-is-firefox',
            opera: 'ws-is-opera',
            chrome: 'ws-is-chrome',
            isNotFullGridSupport: 'ws-is-not-full-grid-support',
            safari11: 'ws-is-safari11',
            isMobileAndroid: 'ws-is-mobile-android',
            isMobileSafari: 'ws-is-mobile-safari',
            isOldWebKit: 'ws-is-old-webkit',
            isWin10: 'ws-is-windows-10',
            isWin8: 'ws-is-windows-8',
            isWin7: 'ws-is-windows-7',
            isWinVista: 'ws-is-windows-vista',
            isWinXP: 'ws-is-windows-xp',
            isUnix: 'ws-is-unix',
            isMac: 'ws-is-mac',
            retailOffline: 'ws-is-sbis-desktop'
         },
         classes = [];

      restrictions = restrictions || {};

      // Add a class to the list of body classes, if it is not restricted in
      // the given `restrictions` object
      function addClassIfNotRestricted(className) {
         if (restrictions[className] !== false) {
            classes.push(className);
         }
      }

      // Map the list of detection properties to corresponding classes
      for (var prop in classMap) {
         if (Env.detection[prop]) {
            addClassIfNotRestricted(classMap[prop]);
         }
      }

      // Manually add different combinations of detection properties
      // to the list of classes
      if (Env.detection.chrome && Env.detection.isMobileIOS) {
         addClassIfNotRestricted('ws-is-mobile-chrome-ios');
      }
      if (Env.detection.isMobileSafari) {
         if ((Env.detection.IOSVersion || 0) < 8) {
            addClassIfNotRestricted('ws-is-mobile-safari-ios-below-8');
         }
      }

      addClassIfNotRestricted(Env.detection.isMobilePlatform ? 'ws-is-mobile-platform' : 'ws-is-desktop-platform');

      addClassIfNotRestricted(Env.compatibility.touch ? 'ws-is-touch' : 'ws-is-no-touch');

      if (Env.detection.isMacOSDesktop && Env.detection.safari) {
         addClassIfNotRestricted('ws-is-desktop-safari');
      }

      if (((Env.detection.isWin7 || Env.detection.isWinVista || Env.detection.isWinXP) && !Env.detection.firefox) || Env.detection.isUnix) {
         addClassIfNotRestricted('ws-fix-emoji');
      }

      if (Env.detection.webkit && !Env.constants.isServerScript && !Env.constants.isNodePlatform) {
         // On the server Chrome is detected as webkit, because it has 'AppleWebKit' in its
         // user agent. We can't check if the browser is Chrome on the server, because a lot
         // of other browsers have 'Chrome' in their user agent string. Only add 'ws-is-webkit'
         // class on the client-side, where we can be sure that it is not Chrome
         addClassIfNotRestricted('ws-is-webkit');
      }

      return classes.join(' ');
   };
});
