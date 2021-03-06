/**
 * File that contains helper functions for processing
 * bind attributes.
 *
 * Author: Ivan Uvarov (is.uvarov@tensor.ru)
 */
define('View/Builder/Tmpl/expressions/bind',
   [
      'View/Builder/Tmpl/expressions/process',
      'View/Builder/Tmpl/expressions/event',
      'View/Builder/Tmpl/expressions/statement',
      'View/Builder/Tmpl/modules/data/utils/functionStringCreator'
   ],
   function (
      processExpressions,
      eventExpressions,
      processStatement,
      FSC
   ) {

   /**
    * Checks if a given attribute is a bind attribute.
    *
    * @param attributeName
    * @returns {boolean}
    */
   function isBind(attributeName) {
      return /^(bind:[A-z0-9])\w*$/.test(attributeName);
   }

   /**
    * Returns target (parent) field name from bind object.
    *
    * @param bindObj
    */
   function getTargetFieldName(bindObject) {
      return bindObject.data[0].name.string;
   }

   /**
    * Returns source (child) field name from bind's attribute name.
    *
    * @param attributeName
    */
   function getSourceFieldName(attributeName) {
      return attributeName.slice(5);
   }

   /**
    * Create event attribute name from bind attribute name.
    * Example: bind:text => event:onChangeText
    *
    * @param attributeName
    * @returns {string}
    */
   function getEventAttributeName(attributeName) {
      var sourceFieldName = getSourceFieldName(attributeName);
      return 'on:' + sourceFieldName + 'Changed';
   }

   /**
    * Create function name from attribute name.
    * Example: text => onChangeText
    *
    * @param attributeName
    * @returns {string}
    */
   function getFunctionName(attributeName) {
      var sourceFieldName = getSourceFieldName(attributeName);
      return sourceFieldName + 'Changed';
   }

   /**
    * Creates event object from the bind attribute.
    *
    * @param bindObject
    * @param attributeName
    * @param data
    * @returns {{name, args, value, fn}|*|Event}
    */
   var getEventObjectForBind = function getEventObjectForBind(bindObject, attributeName, data, isControl) {

      var fn = processExpressions(processStatement.processProperty(getTargetFieldName(bindObject)), data, this.calculators, this.filename),
         funcName = getFunctionName(attributeName);

      // Remove escape wrapper
      fn = fn.replace('markupGenerator.escape(', '').slice(0, -1);

      // Convert getter to setter
      fn = fn.replace('getter', 'setter');

      // Add value argument to setter
      fn = fn.slice(0,-1) + ', value' + fn.slice(-1);

      // Wrap into function
      //fn = 'function ' + funcName + '(event, value) { var data = this; debugger; ' + fn + '; this._forceUpdate(); }.bind(viewController)';

      fn =  FSC.wrapAroundExec(
         '(function(self, _data){ ' +
         '   var f = (function '+funcName+'(event, value) { ' +
         '     var event = arguments[0];' +
         '     var data = this.viewController; ' +
         '     if (!' + fn + '){' +
         '        data = this.data;' +
         '        ' + fn +
         '     }' +
         '  });' +
         '  f = f.bind({viewController: self, data: _data});' +
         '  f.control = self;' +
         '  f.isControlEvent = ' + isControl + ';' +
         '  return f;' +
         '})(viewController, data)' +
         '');
      return eventExpressions.embraceEventChain(undefined, eventExpressions.createEvent(
         // Event name
         'event',
         // Function arguments
         FSC.wrapAroundExec('[]'),
         // Function name
         funcName,
         // Function to execute
         fn));
   };

   return {
      isBind: isBind,
      getEventAttributeName: getEventAttributeName,
      getSourceFieldName: getSourceFieldName,
      getTargetFieldName: getTargetFieldName,
      getFunctionName: getFunctionName,
      getEventObjectForBind: getEventObjectForBind
   };
});