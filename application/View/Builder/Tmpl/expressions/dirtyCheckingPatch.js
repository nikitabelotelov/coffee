define('View/Builder/Tmpl/expressions/dirtyCheckingPatch', [
   'View/Builder/Tmpl/expressions/event',
   'View/Builder/Tmpl/expressions/statement',
   'Core/helpers/Function/shallowClone'
], function (eventExpressions,
             statementExpressions,
             shallowClone) {

   /**
    * Do not add bindings constructions. Vdom has DirtyChecking, and Vdom doesn't have mutable and bind
    * @param v
    * @returns {*|boolean}
    */
   function hasBindings(v) {
      return v && v.name && v.name.string && v.name.string.indexOf && (v.name.string.indexOf('|mutable') > -1 || v.name.string.indexOf('|bind') > -1);
   }

   /**
    * Compare var's expression with tag's attribute
    * @param v - var's expression
    * @param attr - attribute from tag
    * @returns {boolean}
    */
   function compareAttrWithVar(v, attr) {
      return attr.data && attr.data[0] === v;
   }


   /**
    * Adding new var's expressions to tag's attributes
    * @param attribs
    * @param newVars
    */
   function pushIfNeed(attribs, internal, newVars) {
      var k = 0;
      for (var i = 0; i < newVars.length; i++) {
         var needAdd = true;
         for (var j in attribs) {
            if (compareAttrWithVar(newVars[i], attribs[j]) || hasBindings(newVars[i])) {
               needAdd = false;
               break;
            }
         }

         if (needAdd) {
            /**
             * "__dirtyCheckingVars_" is string for detecting dirty checking option.
             */
            /**
             * Переменные из контентых опций, попадают в опции контрола,
             * если expressionRaw будет лететь по ссылке один и тот же,
             * то мы получим конфликт эскейпинга.
             * То есть, если мы напишем в контенте {{ text }}
             * то он прилетит в системную опцию контрола с названием __dirtyCheckingVars_%N
             * Все что летит в опции по умолчанию не эскейпится, потому что это не надо,
             * контрол должен работать с чистыми данными, а все что написано в контентой опции должно эскейпиться.
             * Поэтому здесь добавляем чистую копию описания переменной
             */
            internal['__dirtyCheckingVars_' + (k++)] = {data: [shallowClone(newVars[i])], type: 'text'};
         }
      }
   }

   /**
    * @param str {string}
    * @returns {string} - item name, or empty string in case of invalid argument
    */
   function getItemName(str) {
      str = typeof str === 'string' ? str : '';
      var len = str.length;
      // Going to return a string like "Some.Item"
      if (str[len - 1] !== ')' && str[len - 1] !== ']') {
         // Argument string looks like "Some.Item.attribute"
         return str.substring(0, str.lastIndexOf('.'));
      }
      var leftBracket, rightBracket;
      if (str[len - 1] === ')'){
         // Argument string looks like "Some.Item.method(argument1, Another.Item.method())"
         leftBracket = '(';
         rightBracket = ')';
      } else {
         // Argument string looks like "Some.Item['attribute']"
         leftBracket = '[';
         rightBracket = ']';
      }
      var index = len - 1, stackLength = 1;
      // Find a paired left bracket for the last right bracket
      while (index > 0 && stackLength > 0) {
         index--;
         if (str[index] === rightBracket) {
            stackLength++;
         } else if (str[index] === leftBracket) {
            stackLength--;
         }
      }
      if (rightBracket === ')') {
         return str.substring(0, str.substring(0, index).lastIndexOf('.'));
      } else {
         return str.substring(0, index);
      }
   }

   /**
    * Add ignores from cycle "for".
    */
   function addCycleIgnoredNames(ast) {
      var itemName;
      var forAttrs = ['START_FROM', 'CUSTOM_CONDITION', 'CUSTOM_ITERATOR'];
      for (var i = 0; i < forAttrs.length; ++i) {
         if (ast.attribs.hasOwnProperty(forAttrs[i]) && ast.attribs[forAttrs[i]].data.length) {
            itemName = getItemName(ast.attribs[forAttrs[i]].data[0].name.string);
            if (itemName !== '') {
               this.ignoredNames[itemName] = 1;
            }
         }
      }
   }

   /**
    *
    * @param tag
    * @returns {*}
    */
   function extractVar(tag) {
      var vars = [],
         temp;
      if (tag && tag.data) {
         temp = extractVar(tag.data);
         if (temp) {
            vars = vars.concat(temp);
         }
      } else if (tag && tag.length && typeof tag !== "string") {
         for (var i = 0; i < tag.length; i++) {
            temp = extractVar(tag[i]);
            if (temp) {
               vars = vars.concat(temp);
            }
         }
      } else if (tag && tag.type === 'tag') {
         return detectControlTags.call(this, tag);
      }
      if (vars.length === 0) {
         if (!tag || tag.type !== 'var') {
            return undefined;
         }
         if (!tag.name || typeof tag.name.string !== 'string') {
            return [tag];
         }
         // Skip the tag if name contains one of ignores.
         for (var ignoredName in this.ignoredNames) {
            if (this.ignoredNames.hasOwnProperty(ignoredName) && tag.name.string.indexOf(ignoredName) > -1) {
               return undefined;
            }
         }
         return [tag];
      }
      return vars;
   }

   /**
    * Найдем все контролы в дереве. Потом найдем все внутренние теги и посмотрим
    * на дочерние элементы из узлов attributes и children
    * Если там встретим data.type = "var"
    * Засунем эту переменную в свой scope
    * Это сработает, потому что теперь каждый контрол будет иметь в описании
    * своих опций ВСЕ переменные, которые встречаются в контентых опциях внутри него
    */
   function detectControlTags(ast, isFirstCall) {
      if (!ast) {
         return [];
      }


      var children = ast.children,
         vars = [],
         hasForSource = ast.hasOwnProperty('forSource'),
         isTemplate = false,
         isControl = false;


      if (!ast.children) {
         return [];
      }

      if (ast.name && ast.children[0]) {
         isControl = ast.children[0].type === "control";
         isTemplate = ast.children[0].type === "template";
      }

      // I think this is the best method of storing ignores because "this" doesn't change
      // during the whole recursion. But we need them only for deeper steps, so save copy of ignores.
      var previousIgnores = {};
      if (typeof this.ignoredNames === 'undefined') {
         this.ignoredNames = {};
      } else {
         for (var ignoredName in this.ignoredNames) {
            if (this.ignoredNames.hasOwnProperty(ignoredName)) {
               previousIgnores[ignoredName] = 1;
            }
         }
      }

      if (ast.name && ast.name === 'ws:for' && !hasForSource) {
         addCycleIgnoredNames.call(this, ast);
      }

      for (var i = 0; i < children.length; i++) {
         if (children[i].type === 'tag') {
            vars = vars.concat(detectControlTags.call(this, children[i]));
         } else {
            var varInChild = extractVar(children[i]);
            if (varInChild) {
               vars = vars.concat(varInChild);
            }
         }
      }
      //injectedData
      if (isControl || isTemplate || isFirstCall || ast.name === 'ws:partial') {
         if (ast.injectedData) {
            for (var k = 0; k < ast.injectedData.length; k++) {
               var injectedData = extractVar.call(this, ast.injectedData[k]);
               if (!injectedData) {
                  // invalid syntax construction declared as component option
                  throw new Error('Invalid option in tag "' + ast.name + '"');
               }
               ast.injectedData[k].internal = {};
               pushIfNeed({}, ast.injectedData[k].internal, injectedData);

               if (injectedData) {
                  vars = vars.concat(injectedData);
               }
            }
         }


         if (!ast.attribs && (isControl || isTemplate)) {
            ast.attribs = {};
         }
         if (!ast.internal) {
            ast.internal = {};
         }

         /*Сравнить атрибуты и vars*/
         pushIfNeed(ast.attribs, ast.internal, vars);
      }

      if (ast.attribs) {
         for (var attr in ast.attribs) {
            if (attr && eventExpressions.isEvent(attr)) {
               continue;
            }
            var varInAttr = extractVar(ast.attribs[attr]);
            if (varInAttr) {
               vars = vars.concat(varInAttr);
            }
         }
      }

      if (hasForSource) {
         var varInForSource = extractVar(statementExpressions.createDataVar(ast.forSource.main));
         if (varInForSource) {
            vars = vars.concat(varInForSource);
         }
      }

      // Come back previous ignores.
      this.ignoredNames = previousIgnores;

      return vars;
   }

   function extractGetterFromString(str) {
      var pos = str.lastIndexOf('thelpers.getter'),
         posEnd = str.indexOf(')', pos);

      if (pos === -1 || posEnd === -1) {
         return '';
      }
      return str.substring(pos, posEnd + 1)
   }

   /**
    * Fix apply dirtyChecking
    * Check field in scope before apply it
    * */
   function doDirtyCheckingSafety(object) {
      var dict = {};
      for (var i in object) {
         if (i.indexOf('__dirtyCheckingVars_') > -1) {
            //we don't have closure, if we don't have getter
            if (!object[i]){
               delete object[i];
            } else if (object[i].indexOf('getter') === -1) {
               delete object[i];
            } else if (dict.hasOwnProperty(object[i])) {
               delete object[i];
            } else {
               dict[object[i]] = true;
               var getterPart = object[i].split('.apply'),
                  compr = '', one;
               if (getterPart.length > 1) {
                  for (var k = 0; k < getterPart.length; k++) {
                     one = extractGetterFromString(getterPart[k]);
                     if (one) {
                        compr = one + " && " + compr;
                     }
                  }
               }
               if (compr) {
                  object[i] = object[i].replace('¥', '¥' + compr);
               }
            }
         }
      }
   }

   return {
      detectControlTags: detectControlTags,
      doDirtyCheckingSafety: doDirtyCheckingSafety
   };

});
