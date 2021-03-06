/**
 * Parsing step
 * Traversing/parsing AST-html tree
 */
define('View/Builder/Tmpl/traverse',
   [
      'Core/htmlparser2',
      'View/Builder/Tmpl/modules/utils/common',
      'View/Builder/Tmpl/expressions/statement',
      'View/Builder/Tmpl/modules/control',
      'View/Builder/Tmpl/modules/template',
      'View/Builder/Tmpl/modules/partial',
      'View/Builder/Tmpl/modules/for',
      'View/Builder/Tmpl/expressions/dirtyCheckingPatch',
      'View/Builder/Tmpl/handlers/error',
      'View/Builder/Tmpl/handlers/third-party/dom',
      'View/Builder/Tmpl/checkDomHandler',
      'View/Builder/Tmpl/modules/utils/tag',
      'View/Builder/Tmpl/modules/utils/parse',
      'View/Builder/Tmpl/expressions/event',
      'View/Builder/Tmpl/expressions/bind',
      'View/Builder/Tmpl/modules/data/utils/dataTypesCreator',
      'Core/Deferred',
      'Core/ParallelDeferred',
      'Env/Env'
   ], function traverseLoader(htmlparser2,
                              utils,
                              processStatement,
                              moduleC,
                              tmp,
                              par,
                              fr,
                              dirtyCheckingPatch,
                              errorHandling,
                              domhandler,
                              checkDomHandler,
                              tagUtils,
                              parseUtils,
                              event,
                              bindUtils,
                              DTC,
                              Deferred,
                              ParallelDeferred,
                              Env
   ) {
      var
         translate = /\{\[([\s\S]+?)]}/g,
         htmlEntityRegEx = /^&[^\s;]+;$/,
         lockedNames = [
            'ws:string',
            'ws:number',
            'ws:boolean',
            'ws:value',
            'ws:array',
            'ws:object'
         ];

      function getChildName(element){
         return element.control;
      }
      function getElementAndFrom(element, realFrom){
         var from = element.from;
         element = element.element;
         while(from.array !== realFrom.array){
            element = from.parent;
            from = from.parentFrom;
         }
         return {
            element: element,
            from: from
         };
      }
      function getParentArray(elements, child){
         var forMove = [];
         var minDepsEl = child[getChildName(elements[0])],
            minDeps = minDepsEl.deps;

         for(var i=1;i<elements.length;i++){
            var ch = child[getChildName(elements[i])],
               chDeps = ch.deps;
            if (minDeps > chDeps){
               minDeps = chDeps;
               minDepsEl = ch;
            }
         }

         for(var i=0;i<elements.length;i++){
            var chName = getChildName(elements[i]),
               toMove = getElementAndFrom(child[chName], minDepsEl.from);
            toMove.name = chName;
            toMove.attrName = elements[i].to;
            forMove.push(toMove);
         }
         return forMove;
      }
      function compositeProcessing(traversed, _hocs, _childMap, _deps, from){
         var childMap = _childMap||{};
         var deps = _deps||0;
         var hocs = _hocs||[];

         if (traversed.attribs){ //Мы внутри AST узла
            if (traversed.attribs.name && traversed.attribs.name.data){
               //Есть имя. Сохраним.
               childMap[traversed.attribs.name && traversed.attribs.name.data.value] = {
                  element: traversed,
                  from: from,
                  deps: deps
               };
            }

            var currentHoc;
            for(var attrName in traversed.attribs){
               if (attrName.indexOf('ws:')===0 && traversed.attribs[attrName].data) {
                  if (!currentHoc){
                     currentHoc = {
                        from: from,
                        hoc: traversed,
                        elements: []
                     };
                  }
                  var nameDest = traversed.attribs[attrName].data.value;

                  currentHoc.elements.push({
                     control: nameDest,
                     to: attrName
                  });
                  delete traversed.attribs[attrName];
               }
            }
            if (currentHoc){
               hocs.push(currentHoc);
            }
         }



         if (traversed.children){
            compositeProcessing(traversed.children, hocs, childMap, deps++,
               {
                  array: traversed.children,
                  parent: traversed,
                  parentFrom: from
               });
         }
         if (traversed.injectedData) {
            compositeProcessing(traversed.injectedData, hocs, childMap, deps++,
               {array: traversed.injectedData,
               parent: traversed,
               parentFrom: from});
         }

         if (traversed.length){
            //Если массив, уходим внутрь
            for(var i=0;i<traversed.length;i++){
               compositeProcessing(traversed[i], hocs, childMap, deps++, {array:traversed,
                  parent: traversed[i],
                  parentFrom: from});
            }
         }


         return {hocs:hocs, childMap: childMap};
      }

      /**
       * Добавляет теги шаблонизатора к тексту, для перевода
       * @param text - текст для обрамления {[ ]}
       * @returns String
       */
      function addTranslateTagToText(text) {
         var temp = text.trim();
         // если текст уже локализован, ничего не делаем
         if (temp.indexOf('{[') !== -1) {
            return text;
         } else {
            return text.replace(temp, '{[' + temp + ']}');
         }
      }

      'use strict';
      var traverse = {
         /**
          * Modules to traverse on parse step
          */
         _modules: {
            'ws:template': tmp,
            'ws:partial': par,
            'ws:for': fr
         },
         /**
          * Attribute module to traverse on parse step
          */
         _attributeModules: {
            'for': fr
         },
         /**
          * Regular expression for finding variables/expression inside of AST
          */
         _regex: {
            forVariables: /\{\{ ?([\s\S]*?) ?\}\}/g,
            forLocalization: /\{\[ ?([\s\S]*?) ?\]\}/g
         },
         /**
          * Safe replacing
          */
         safeReplaceCaseReg: /\r|\n|\t|\/\*[\s\S]*?\*\//g,
         /**
          * Safe placeholder
          */
         safeReplaceCasePlace: "",
         /**
          * Include promises stack
          * @type {Object}
          */
         includeStack: {},
         reservedCanBeOptions: ['ws:template'],
         restrictedTags: ['script'],
         /**
          * Parsing html string to the directive state
          * @param  {String} tmpl     string html template
          * @param  {Function} handler function for handling parsing result
          * @param {Boolean} isCheckTmpl Запускать ли проверку шаблона на валидность
          * @return {Array}           html AST
          */
         parse: function parse(tmpl, handler, isCheckTmpl, filename) {
            // проверка на валидность тегов
            if (isCheckTmpl) {
               var checkParser = new htmlparser2(new checkDomHandler(function (error) {
                  if (error) {
                     error.message = 'filename: ' + filename + ',\n' + error.message;
                     throw error;
                  }
               }.bind(this)), {
                  xmlMode: true,
                  recognizeSelfClosing: true,
                  failOnInnerCurlyBrace: true,
                  generateTagErrors: true
               });
               checkParser.write(tmpl);
               checkParser.done();
            }

            var handlerOptions = {
                  ignoreWhitespace: true
               },
               parserOptions = {
                  lowerCaseTags: false,
                  lowerCaseAttributeNames: false,
                  recognizeSelfClosing: true
               },
               handler = new domhandler(handler || this.defaultHandler, handlerOptions),
               parser2 = new htmlparser2(handler, parserOptions);

            parser2.write(tmpl);
            parser2.done();
            return handler.dom;
         },
         /**
          * Attribute traverse in order to find variables
          * @param  {Array}        array of attributes
          * @return {Array}        array of attributes with variables
          */
         _traverseTagAttributes: function traverseTagAttributes(attribs) {
            var dataAttributes = utils.clone(attribs);
            return utils.eachObject(dataAttributes, function traverseTagAttributesEach(attrib, titleAttribute) {
               var res;
               // храню в состоянии название опции компонента, используется в traverse для локализации (проверяется, локализуема ли текущая опция)
               // храню массивом путь до опции, ведь опция может быть внутри других опций
               this._optionName = this._optionName || [];
               this._optionName.push(titleAttribute);
               try {
                  if (event.isEvent(titleAttribute) ||
                     bindUtils.isBind(titleAttribute)) {
                     res = this._traverseProperty(attrib);
                  } else {
                     res = this._traverseText({
                        data: attrib
                     });
                  }
               } finally {
                  this._optionName.pop();
               }
               return res;
            }.bind(this));
         },
         _createTextVarNode: function createTextVarNode(node) {
            var d = [node];
            return { data: d, type: 'text', property: true };
         },
         _traverseProperty: function traverseProperty(property) {
            return this._createTextVarNode(processStatement.processProperty(property));
         },
         /**
          * Removing unnecessary stuff from strings
          * @param  {String} string   data string
          * @return {String}         clean data string
          */
         _replaceAllUncertainStuff: function replaceAllUncertainStuff(string) {
            return string.replace(this.safeReplaceCaseReg, this.safeReplaceCasePlace);
         },
         _searchFor: function (array, regex) {
            return utils.mapForLoop(array, function searchForVarsLoop(value) {
               var val;
               val = value.split(regex).join('');
               return val;
            }.bind(this));
         },
         /**
          * Searching for vars in string
          * @param  {Array} arrOfVars array of variables and text
          * @return {Array}           array of variables
          */
         _searchForVars: function searchForVars(arrOfVars) {
            return this._searchFor(arrOfVars, this._regex.forVariables);
         },
         /**
          * Searching for vars in string
          * @param  {Array} arrOfVars array of variables and text
          * @return {Array}           array of variables
          */
         _searchForLocalizedVars: function searchForLocalizedVars(arrOfVars) {
            return this._searchFor(arrOfVars, this._regex.forLocalization);
         },
         /**
          * Replacing and creating statements for variables and text chunks
          * @param  {Array} data         array of incoming data
          * @param  {Array} arrOfVars    array with variables
          * @return {Array}              array with objects
          */
         _replaceAndCreateStatements: function replaceAndCreateStatements(data, arrOfVars, localizedVars) {
            var array = [], i, emptyString = "";
            for (i = 0; i < data.length; i++) {
               if (data[i] !== emptyString) {
                  array.push(processStatement.processInnerStatements.call(this, data[i], arrOfVars, localizedVars));
               }
            }
            return array;
         },
         /**
          * Returns the JSDoc information for a component or a typedef
          * @param {String} name component or typedef name
          * @return {Object} JSDoc information
          */
         _getPropertiesInformation: function(name) {
            return this.componentsProperties[name] && this.componentsProperties[name].properties['ws-config'].options;
         },
         // добавляет слово в словарь локализуемых слов
         _addWord: function(value) {
            var key, context;
            value.replace(translate, function (match, value) {
               if (value.indexOf('@@') > -1) {
                  // Значит в ключе содержится контекст
                  context = value.substring(0, value.indexOf('@@'));
                  key = value.substr(value.indexOf('@@') + 2);
               }
               this.words.push({
                  key: key || value,
                  context: context || '',
                  module: this.filename
               });
            }.bind(this));
         },

         // checks if data is localizable and adds it to the dictionary if it is
         _findLocaleVariables: function(data) {
            var
               self = this,
               translatable = false;

            function canBeTranslated(text) {
               // Text is considered possible to translate if it is not:
               // 1. A variable: {{ someOption }}, Text with {{ option }}s - can't be translated
               // 2. A single html entity: &amp;, &#123 - shouldn't be translated
               //    (Text with html entities can be translated: String &amp; entity)
               // 3. An INCLUDE instruction: %{INCLUDE ...} - for compatibility
               return !self._regex.forVariables.test(text) &&
                  !htmlEntityRegEx.test(text.trim()) &&
                  text.indexOf('%{INCLUDE') === -1;
            }

            this._oldComponentInside = this._oldComponentInside || 0;
            this._scriptInside = this._scriptInside || 0;
            this._styleInside = this._styleInside || 0;

            if (translate.test(data)) {
               // Text is already wrapped in {[ rk-brackets ]}, no need to check if it is localizable
               translatable = true;
            } else if (this._oldComponentInside === 0 && this._scriptInside === 0 && this._styleInside === 0) {
               // Check if component's option is localizable by checking the JSDoc for it. Localizable
               // options have "@translatable" label on them
               if (this._currentPartialName && this._currentPartialName.length) {
                  var currentPartialName = this._currentPartialName[this._currentPartialName.length - 1],
                     jsDocOptions = this._getPropertiesInformation(currentPartialName);

                  var checkTranslatable = function checkTranslatable(jsDocInfo, optionNamesStack) {
                     var currentOptionInfo = jsDocInfo;

                     for (var i = 0; i < optionNamesStack.length && currentOptionInfo; i++) {
                        var
                           nextStep = optionNamesStack[i],
                           typedefName = currentOptionInfo.itemType || currentOptionInfo.arrayElementType,
                           hasATypedef = typeof typedefName === 'string';

                        if (currentOptionInfo.translatable) {
                           // Every property of the translatable option is localizable, there is no
                           // need to continue checking - stop going through JSDoc
                           break;
                        } else if (hasATypedef) {
                           currentOptionInfo = self._getPropertiesInformation(typedefName);
                        }

                        if (currentOptionInfo) {
                           currentOptionInfo = currentOptionInfo[nextStep];
                        }
                     }

                     if (canBeTranslated(data)) {
                        return currentOptionInfo && currentOptionInfo.translatable;
                     }
                  };

                  translatable = jsDocOptions && this._optionName && checkTranslatable(jsDocOptions, this._optionName)
               } else {
                  // If this is not a component's option, mark text as localizable if it is a simple
                  // text node (this._optionName is missing), or if it is the `title` attribute of
                  // a tag (_optionName[0] === 'title', title is always localizable)
                  translatable = canBeTranslated(data) && (!this._optionName || !this._optionName[0] || this._optionName[0] === 'title');
               }
            }

            if (translatable) {
               // Wrap the text with {[ rk-brackets ]} (if possible) and add it to the dictionary
               data = addTranslateTagToText(data);
               this._addWord(data);
            }

            return data;
         },
         _createDataObjectWorkWithProperty: function createDataObjectWorkWithProperty(data, arrOfVarsClean, localizedVars) {
            if (arrOfVarsClean || localizedVars) {
               return this._replaceAndCreateStatements(data, arrOfVarsClean, localizedVars);
            }
            return processStatement.createDataText(data[0]);
         },
         /**
          * Looking for variables in string data object
          * @param  {Object} strObjectData
          * @param  {Array} arrOfVarsClean Array of variables in data object
          * @return {Object}
          */
         _createDataObject: function createDataObject(strObjectData, arrOfVarsClean, localizedVars) {
            strObjectData.data = this._createDataObjectWorkWithProperty(strObjectData.data, arrOfVarsClean, localizedVars);
            return strObjectData;
         },
         /**
          * Создание объектов локали
          * @param loc
          * @returns {{val: *, loc: boolean}}
          * @private
          */
         _createLocales: function createLocales(loc) {
            return { val: loc, loc: true };
         },
         /**
          * Для разбора строки на локали
          * @param data
          * @returns {Array}
          * @private
          */
         _localizeStatements: function localizeStatements(data, localizedClean) {
            var dataArray = [], step = [];
            for (var i = 0; i < data.length; i++) {
               step = data[i].split(this._regex.forLocalization);
               if (step.length > 1) {
                  for (var y = 0; y < step.length; y++) {
                     if (!utils.inArray(localizedClean, step[y])) {
                        dataArray.push(step[y]);
                     } else {
                        dataArray.push(this._createLocales(step[y]));
                     }
                  }
               } else {
                  dataArray.push(data[i]);
               }
            }
            return dataArray;
         },
         /**
          * Preparing data-like string for structured tree
          * @param  {Object} str incoming data string
          * @return {Object}     data object { data: { type: "text", value: 'wadawd' } }
          */
         _replaceMatch: function replaceMatch(strObjectData) {
            var
               resString = this._replaceAllUncertainStuff(strObjectData.data),
               arrOfVars = resString.match(this._regex.forVariables),
               localizedVars = resString.match(this._regex.forLocalization),
               localizedVarsClean,
               arrOfVarsClean;

            if (arrOfVars) {
               arrOfVarsClean = this._searchForVars(arrOfVars);
            }
            if (localizedVars) {
               localizedVarsClean = this._searchForLocalizedVars(localizedVars);
            }

            strObjectData.data = resString.split(this._regex.forVariables);
            if (localizedVarsClean) {
               strObjectData.data = this._localizeStatements.call(this, strObjectData.data, localizedVarsClean);
            }
            return this._createDataObject(strObjectData, arrOfVarsClean, localizedVarsClean);
         },
         /**
          *  Looking for variables in strings
          * @param  {Object} statement   string statement
          * @return {Object}             data object { data: { type: "text", value: 'wadawd' } }
          */
         _lookForStatements: function lookForStatements(statement) {
            if (statement) {
               // если собираем словарь локализуемых слов, исследуем строку на наличие локализуемых слов
               if (this.createResultDictionary) {
                  statement.data = this._findLocaleVariables(statement.data);
               }
               return this._replaceMatch(statement);
            }
         },
         _traverseTag: function traverseTag(name, injectedData) {
            if (injectedData && ~this.reservedCanBeOptions.indexOf(name)) {
               return this._handlingTag;
            } else {
               if (this._modules[name]) {
                  return this._traverseModule;
               }
               if (tagUtils.isTagRequirable.call(this, name, DTC.injectedDataTypes, injectedData)) {
                  return this._traverseOptionModule;
               }
            }
            return this._handlingTag;
         },
         /**
          * Resolving method to handle tree childs
          * @param  {Object} entity  tag, text or module
          * @return {Function}       traverse method to use
          */
         _whatMethodShouldYouUse: function whatMethodShouldYouUse(entity, data) {
            return tagUtils.findFunctionCase.call(this, entity, '_traverse', data);
         },
         /**
          * Perform action on main data array
          * @param  {Array} modAST         AST array
          * @param  {Object|Array} traverseObject object or array of objects with tag or text
          * @return {Array}                AST array
          */
         actionOnMainArray: function actionOnMainArray(modAST, traverseObject) {
            if (traverseObject !== undefined && traverseObject.length > 0) {
               for (var i = 0; i < traverseObject.length; i++) {
                  if (traverseObject[i]) {
                     modAST.push(traverseObject[i]);
                  }
               }
            }
            traverseObject = null;
            return modAST;
         },
         /**
          * Collecting states from traversing tree
          * @param  {Function} traverseMethod traverse function for entity
          * @param  {Object} value          Tag, text or module
          * @return {Object}                State promise
          */
         _collect: function collect(traverseMethod, value, injectedData) {
            return traverseMethod.call(this, value, injectedData);
         },
         _checkIsPropertyName: function(name) {
            return name && name.indexOf('ws:') === 0 && lockedNames.indexOf(name.toLowerCase()) === -1;
         },
         /**
          * Traversing ast
          * @param  {Array} ast AST array
          * @return {Array}    array of State promises
          */
         traversingAST: function traversingAST(ast, prefix, injectedData) {
            var traverseMethod,
               pDeferred = new ParallelDeferred(),
               keyIndex = 0,
               collect,
               parentKey = '';
            for (var i = 0; i < ast.length; i++) {
               traverseMethod = this._whatMethodShouldYouUse(ast[i], injectedData);
               if (traverseMethod) {
                  if (ast[i].type === 'tag') {
                     if (ast[i].parent){
                        if (tagUtils.isWsControl(ast[i].parent) || ast[i].parent.name === 'ws:partial' ||  ast[i].parent.name === 'ws:for'){
                           parentKey = '';
                        } else {
                           parentKey = (ast[i].parent ? (ast[i].parent.key) : '');
                        }
                     }
                     ast[i].key = parentKey + (keyIndex++)+'_';
                     ast[i].prefix = prefix;
                  }
                  if (ast[i].type === 'text') {
                     parentKey = (ast[i].parent ? (ast[i].parent.key) : '');
                     ast[i].key = parentKey + (keyIndex++)+'_';
                     ast[i].prefix = prefix;
                  }
                  ast[i] = parseUtils.checkForAttributes(ast[i]);
                  try {
                     if (injectedData && this._checkIsPropertyName(ast[i].name)) {
                        this._optionName.push(ast[i].name.replace('ws:', ''));
                     }
                     collect = this._collect(traverseMethod, ast[i], injectedData);
                  } finally {
                     if (injectedData && this._checkIsPropertyName(ast[i].name)) {
                        this._optionName.pop();
                     }
                  }
                  if (collect !== undefined) {
                     pDeferred.push(collect);
                  }
               }
            }
            return pDeferred.done().getResult().addCallbacks(
               this.resolveNodesToArray,
               this.failedTraverse
            );
         },
         resolveNodesToArray: function resolveNodesToArray(data) {
            return Object.keys(data).map(function (key) { return data[key]; })
         },
         failedTraverse: function failedTraverse(error) {
            return error;
         },
         /**
          * Starting point
          * @param  {Array} ast    [description]
          * @return {Object}       State promise
          */
         traverse: function traverse(ast, resolver, config) {
            var def = new Deferred();
            if (resolver) {
               this.resolver = resolver;
               if (config) {
                  this.filename = config.filename;
                  this.config = config.config;
                  this.fromBuilderTmpl = config.fromBuilderTmpl;
                  // опция говорит о том, что нужно собирать словарь локализуемых слов
                  this.createResultDictionary = config.createResultDictionary;
                  // информация о компонентах, полученная из билдера модулем jsDoc, используется для проверки, локализуемы ли опции
                  this.componentsProperties = config.componentsProperties;
                  if (this.createResultDictionary) {
                     this.words = [];
                  }
               }
            }
            this.traversingAST(ast).addCallbacks(
               function resulting(data) {
                  if (data) {
                     var astResult = this.actionOnMainArray([], data);

                     var dataComposite = compositeProcessing(astResult);
                     var hocs = dataComposite.hocs;
                     var child = dataComposite.childMap;
                     var hocReplace;
                     for (var k = hocs.length - 1; k >= 0; k--) {
                        var cHoc = hocs[k];
                        var arrayMove = getParentArray(cHoc.elements, child);
                        hocReplace = undefined;
                        if (!cHoc.hoc.injectedData) {
                           cHoc.hoc.injectedData = [];
                        }
                        for (var j=0;j<arrayMove.length;j++) {
                           cHoc.hoc.injectedData.push({
                              attribs: undefined,
                              children: [arrayMove[j].element],
                              data: undefined,
                              key: 0,
                              name: arrayMove[j].attrName,
                              selfclosing: false,
                              type: "tag"
                           });
                           var ind = arrayMove[j].from.array.indexOf(arrayMove[j].element);
                           if (j===0){
                              arrayMove[j].from.array[ind] = cHoc.hoc;
                              ind = cHoc.from.array.indexOf(cHoc.hoc);
                              cHoc.from.array.splice(ind, 1);
                           } else {
                              arrayMove[j].from.array.splice(ind, 1);
                           }
                           if (hocReplace){
                              child[arrayMove[j].name] = hocReplace;
                           } else {
                              hocReplace = child[arrayMove[j].name];
                              child[arrayMove[j].name].element = cHoc.hoc;
                              child[arrayMove[j].name].from = arrayMove[j].from;
                           }
                        }
                     }

                     astResult.__newVersion = true;
                     for(var travI=0;travI<astResult.length;travI++) {
                        try {
                           dirtyCheckingPatch.detectControlTags(astResult[travI], true);
                        } catch (e) {
                           def.errback(new Error('Something wrong with ' + this.filename + ' template. ' + e.message));
                           return;
                        }
                     }

                     // в случае сбора словаря локализуемых слов отдаем объект {astResult - ast-дерево, words - словарь локализуемых слов}
                     if (this.createResultDictionary) {
                        def.callback({
                           astResult: astResult,
                           words: this.words
                        });
                     } else {
                        def.callback(astResult);
                     }
                     return astResult;
                  } else {
                     def.errback(new Error('Something wrong with ' + this.filename + ' template.'));
                  }
               }.bind(this),
               function broken(error) {
                  def.errback(error);
                  errorHandling(error, this.filename);
               }.bind(this)
            );
            return def;
         },
         /**
          * Generating tag and tag childs
          * @param  {Object} tag   tag
          * @param  {Array} inner children
          * @return {Object}      Tag
          */
         _generatorFunctionForTags: function generatorFunctionForTags(tag, inner) {
            tag.children = this.actionOnMainArray([], inner);
            return tag;
         },
         /**
          * Traversing tag with children
          * @param  {Object} tag
          * @return {Object}         State promise
          */
         traverseTagWithChildren: function traverseTagWithChildren(tag, injectedData) {
            var def = new Deferred();
            this.traversingAST(tag.children, tag.prefix, injectedData).addCallbacks(
               function traverseTagSuccess(ast) {
                  var result = this._generatorFunctionForTags(tag, ast);
                  def.callback(result);
               }.bind(this),
               function brokenTagTraversing(error) {
                  def.errback(error);
                  errorHandling(error, this.filename);
               }.bind(this)
            );
            return def;
         },
         /**
          * Traverse manageable attributes from _attributeModules
          * @param attribs
          * @returns {Array}
          */
         _traverseManageableAttributes: function traverseManageableAttributes(attribs) {
            var constructArray = [], attrib;
            for (attrib in attribs) {
               if (this._attributeModules.hasOwnProperty(attrib) && attribs[attrib]) {
                  constructArray.push({ module: attrib, value: attribs[attrib] });
               }
            }
            return constructArray;
         },
         /**
          * Apply module function on tag with manageable attributes
          * @param tag
          * @returns {*}
          */
         _useManageableAttributes: function useManageableAttributes(tag, injectedData) {
            var constructArray = this._traverseManageableAttributes(tag.attribs);
            if (!!constructArray.length) {
               var moduleName = constructArray.shift().module;
               // если элемент - label, нужно рассматривать его атрибут for как уникальный идентификатор http://htmlbook.ru/html/label/for , а не как цикл в tmpl
               if (moduleName === 'for' && tag.name === 'label') {
                  return this._generateTag(tag, injectedData);
               }
               return tagUtils.loadModuleFunction.call(
                  this,
                  parseUtils.attributeMatcherByName.call(this, moduleName),
                  tag
               );
            }
            return this._generateTag(tag, injectedData);
         },
         /**
          * Checking tag for manageable attributes
          * @param tag
          * @returns {*}
          */
         _checkForManageableAttributes: function checkForManageableAttributes(tag, injectedData) {
            if (tag.attribs) {
               return this._useManageableAttributes(tag, injectedData);
            }
            return this._generateTag(tag, injectedData);
         },
         /**
          * Generating tag object
          * @param tag
          * @returns {*}
          */
         _generateTag: function generateTag(tag, injectedData) {
            var def = new Deferred(), attribs, takeTag;
            try {
               attribs = this._traverseTagAttributes(tag.attribs);
               takeTag = this._acceptTag(tag, attribs);
               if (takeTag.children && takeTag.children.length > 0) {
                  var res;
                  this._oldComponentInside = this._oldComponentInside || 0;
                  this._scriptInside = this._scriptInside || 0;
                  this._styleInside = this._styleInside || 0;
                  if (takeTag.name === 'component') {
                     this._oldComponentInside++;
                  }
                  if (takeTag.name === 'script') {
                     this._scriptInside++;
                  }
                  if (takeTag.name === 'style') {
                     this._styleInside++;
                  }
                  try {
                     res = this.traverseTagWithChildren(takeTag, injectedData);
                  } finally {
                     if (takeTag.name === 'component') {
                        this._oldComponentInside--;
                     }
                     if (takeTag.name === 'script') {
                        this._scriptInside--;
                     }
                     if (takeTag.name === 'style') {
                        this._styleInside--;
                     }
                  }

                  return res;
               }
               def.callback(this._generatorFunctionForTags(takeTag));
            } catch (e) {
               Env.IoC.resolve('ILogger').error("traverse", e.stack);
               def.errback(errorHandling(e, this.filename));
            }
            return def;
         },
         /**
          * Main function for tag traversing
          * @param  {Object} tag
          * @return {Object}     State promise
          */
         _handlingTag: function handlingTag(tag, injectedData) {
            return this._checkForManageableAttributes(tag, injectedData);
         },
         /**
          * Traverse requirable tag
          * @param tag
          * @returns {Array}
          */
         _traverseOptionModule: function traverseOptionModule(tag) {
            return tagUtils.loadModuleFunction.call(this, moduleC.parse, this._acceptTag(tag, tag.attribs));
         },
         /**
          * Main function for finding traverse method for module
          * @param  {Object} tag
          * @return {Array}     Module function
          */
         _traverseModule: function traverseModule(tag) {
            var normalizedTag = this._acceptTag(tag, tag.attribs);
            var tagModule = parseUtils.parserMatcher.call(this, normalizedTag);
            return tagUtils.loadModuleFunction.call(this, tagModule, normalizedTag);
         },
         /**
          * Text node traversing
          * @param  {Object} text
          * @return {Object}       promise or text
          */
         _traverseText: function traverseText(text) {
            var def = new Deferred(),
               statements,
               choppedText = this.createTextNode(text);
            if (text.hasOwnProperty('type')) {
               text.data = this._replaceAllUncertainStuff(choppedText.data);
               try {
                  statements = this._lookForStatements(choppedText);
                  def.callback(statements);
               } catch (e) {
                  def.errback(errorHandling(e, this.filename));
               }
               return def;
            }
            return this._lookForStatements(choppedText);
         },
         _traverseDirective: function _traverseDirective(directive) {
            var def = new Deferred();
            def.callback(directive);
            return def;
         },
         _traverseComment: function _traverseComment(comment) {
            var def = new Deferred();
            if (comment.data) {
               def.callback(this._lookForStatements(comment));
            }
            return def;
         },
         /**
          * Creating tag
          * @param  {String} name
          * @param  {Array|Object} data
          * @param  {String} raw
          * @param  {Object} attribs
          * @param  {Array} children
          * @return {Object}
          */
         _createTag: function createTag(tag) {
            return {
               name: tag.name,
               data: tag.data,
               key: tag.key,
               attribs: tag.attribs,
               children: tag.children,
               selfclosing: tag.selfclosing,
               type: "tag"
            };
         },
         /**
          * Accepting tag to the AST
          * @param tag
          * @param attribs
          * @returns {Object}
          */
         _acceptTag: function acceptTag(tag, attribs) {
            return this._createTag({
               name: tag.name,
               data: tag.data,
               key: tag.key,
               attribs: attribs,
               children: tag.children,
               selfclosing: !!tag.selfclosing
            });
         },
         /**
          * Default handler for parsing
          * @param  {Error} error
          * @param  {Array} dom
          * @return
          */
         defaultHandler: function defaultHandler(error, dom) {
            if (error) {
               errorHandling(error, this.filename);
            }
         },
         createTextNode: function createTextNode(entity) {
            return {
               data: entity.data,
               type: "text",
               key: entity.key
            }
         },
         getComponents: function getComponents(ast) {
            var cArray = [];
            function createTemplate(template) {
               var
                  optionalTemplate = tagUtils.splitOptional(template),
                  jsTemplate = tagUtils.splitJs(template),
                  htmlTemplate = tagUtils.splitHtml(template),
                  tmplTemplate = tagUtils.splitTmpl(template),
                  wmlTemplate = tagUtils.splitWml(template),
                  slashedTemplate = tagUtils.slashedControl(template);
               if (optionalTemplate) return 'optional!' + optionalTemplate;
               else if (jsTemplate) return 'js!' + jsTemplate;
               else if (htmlTemplate) return 'html!' + htmlTemplate;
               else if (tmplTemplate) return 'tmpl!' + tmplTemplate;
               else if (wmlTemplate) return 'wml!' + wmlTemplate;
               else if (slashedTemplate) return template;
            }
            function checkIfComponent(name, types, entity) {
               var
                  wsComponent = tagUtils.isTagRequirable.call(this, name, types, true, true);
               if (wsComponent) {
                  return wsComponent;
               }
               if (name === 'ws:partial' && entity.attribs && processStatement.isStaticString(entity.attribs.template)) {
                  return createTemplate(entity.attribs.template);
               }
            }
            function getComponentsRec(ast) {
               var componentName;
               for (var i=0; i < ast.length; i++) {
                  componentName = checkIfComponent.call(this, ast[i].name, DTC.injectedDataTypes, ast[i]);
                  if (componentName) {
                     if (utils.isLibraryModuleString(componentName)) {
                        // this is a library module, we should add the whole library to the dependencies
                        componentName = utils.splitModule(componentName).library;
                     }
                     if (!~cArray.indexOf(componentName)) {
                        cArray.push(componentName);
                     }
                  }
                  if (ast[i].children && ast[i].children.length > 0) {
                     getComponentsRec.call(this, ast[i].children);
                  }
               }
            }
            getComponentsRec.call(this, ast);
            return cArray;
         },
         getDependencies: function getDependencies(ast, error) {
            if (!error) {
               return ['View/Executor/TClosure'].concat(this.getComponents.call(this, ast));
            }
         }
      };
      return traverse;
   });
