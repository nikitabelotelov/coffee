/* global define */
define('WS.Data/Source/ISource', [
   'Types/util'
], function(
   util
) {
   'use strict';

   util.logger.error('WS.Data/Source/ISource', 'Module is deprecated and will be removed in 19.200. Use Types/source:ISource instead.');

   // This module needs only for backward compatibility
   return {
      '[WS.Data/Source/ISource]': true,
      '[Types/_source/ICrud]': true,
      '[WS.Data/Source/ICrud]': true,
      '[Types/_source/ICrudPlus]': true,
      '[WS.Data/Source/ICrudPlus]': true,

      MOVE_POSITION: {
         on: 'on',
         before: 'before',
         after: 'after'
      }

   };
});