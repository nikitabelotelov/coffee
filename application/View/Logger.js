define('View/Logger', [], function() {
   var
      viewLoggerRegexp = /[?&]viewLogger=([^&]*)/i,
      viewLoggerLevelRegexp = /[?&]viewLoggerLevel=([^&]*)/i;


   function ViewLogger() {
      this._loggerStatus = this._isLoggedUrl();
      this._msgLevel = this._getLoggerLevelFromUrl();
      this._statusOverride = false;

      var global = (function() {
         return this || (0, eval)('this'); // eslint-disable-line no-eval
      }());
      this._console = global ? global.console : null;
   }

   ViewLogger.prototype.getLoggerStatus = function() {
      if (this._statusOverride) {
         // statusOverride takes priority
         return true;
      }

      if (typeof window !== 'undefined') {
         // on client logger can be enabled and disabled normally
         // by changing loggerStatus
         return this._loggerStatus;
      }

      // on server loggerStatus does not matter, logging depends on viewLogger
      // query param (if statusOverride is not enabled)
      return this._isLoggedUrl();
   };

   ViewLogger.prototype.setLoggerStatus = function(status, applyOnServer) {
      this._loggerStatus = status;
      if (!status || applyOnServer) {
         // setLoggerStatus(false) always disables logger, but
         // setLoggerStatus(true) only enables logger on server
         // if applyOnServer is true
         this._statusOverride = status;
      }
   };

   ViewLogger.prototype.setMsgLevel = function(level) {
      this._msgLevel = level;
   };

   ViewLogger.prototype.catchLifeCircleErrors = function(hookName, error) {
      this._errorToConsole('LIFECYCLE ERROR. HOOK NAME: ' + hookName, error, error);
   };

   ViewLogger.prototype.log = function(processName, msg) {
      if (this.getLoggerStatus()) {
         for (var i = 0; i <= this._msgLevel && i < msg.length; i++) {
            if (msg[i]) {
               this._logToConsole('View logger [' + processName + ']', msg[i]);
            }
         }
      }
   };

   ViewLogger.prototype._isLoggedUrl = function() {
      return this._getQueryParam('viewLogger', viewLoggerRegexp) === 'true';
   };

   ViewLogger.prototype._getLoggerLevelFromUrl = function() {
      var level = this._getQueryParam('viewLoggerLevel', viewLoggerLevelRegexp);
      if (level) {
         return Number.parseInt(level, 10);
      }
      return 0;
   };

   ViewLogger.prototype._getQueryParam = function(paramName, paramRegexp) {
      var req = typeof process !== 'undefined' && process.domain && process.domain.req;
      if (req && req.query) {
         return req.query[paramName];
      }
      if (typeof window !== 'undefined' && window.location) {
         var match = window.location.search.match(paramRegexp);
         return match && match[1];
      }
      return null;
   };

   ViewLogger.prototype._logToConsole = function() {
      if (this._console && this._console.log) {
         this._console.log.apply(this._console, arguments);
      }
   };

   ViewLogger.prototype._errorToConsole = function() {
      if (this._console && this._console.error) {
         this._console.error.apply(this._console, arguments);
      } else {
         this._logToConsole.apply(this, arguments);
      }
   };

   return new ViewLogger();
});
