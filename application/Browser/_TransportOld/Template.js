define('Browser/_TransportOld/Template', [
    'require',
    'Core/core-extend',
    'Core/ParallelDeferred',
    'Core/Deferred',
    'Env/Env',
    'View/Runner/requireHelper',
    'Browser/_TransportOld/nodeType'
], function (require, coreExtend, ParallelDeferred, Deferred, Env, requireHelper, nodeType) {
    var Template;
    /**
     * @class Transport/Templates/Template
     * @author Бегунов А.В.
     * @public
     */
    Template = coreExtend({}, /** @lends Transport/Templates/Template.prototype */ {
        /**
         * @cfg {String} Название шаблона, оно же путь к нему
         * @name SBIS3.CORE.Template#templateName
         */
        $protected: {
            _templateName: '',
            _dReady: null,
            _loadedHandlers: {},
            _configuration: {
                autoWidth: false,
                autoHeight: false,
                isRelativeTemplate: false,
                minWidth: 0
            }
        },
        $constructor: function (cfg) {
            this._templateName = cfg.templateName;
            this._dReady = new ParallelDeferred();
            this._dReady.getResult().
                addCallback(this._attachResources.bind(this)).
                addCallback(this._loadDependencies.bind(this));
        },
        isPage: function () {
            throw new Error("Template::isPage - method is not implemented!");
        },
        _collectAllControlsToPreload: function (source) {
            throw new Error("Template::_collectAllControlsToPreload - method is not implemented!");
        },
        _loadDependencies: function () {
            var controlConfigs = this._collectAllControlsToPreload(this.getControls(undefined)), configsPaths = controlConfigs.map(function (cfg) {
                return [cfg.type, cfg];
            }, []);
            return this._loadControlsDependencies(configsPaths, true);
        },
        _loadControlsDependencies: function (configsPaths, resolveCtors) {
            var loadedPaths = {};
            function requireModules(defer, path) {
                return function () {
                    if (!Env.constants.isServerScript && requireHelper.defined(path)) {
                        var cnstr = require(path);
                        defer.callback([path, cnstr]);
                    }
                    else {
                        require([path], function (constr) {
                            defer.callback([path, constr]);
                        });
                    }
                    return defer;
                };
            }
            function loaderForPath(path, resolveCtor) {
                var result;
                var loadDfr = new Deferred(), coreModules = ['Deprecated', 'Lib'], moduleName = path.indexOf('/') > 0 ? path.split('/')[0] : false;
                if (moduleName && (coreModules.indexOf(moduleName) > -1 || Object.keys(Env.constants.modules).some(function (name) { return Env.constants.modules[name] === moduleName; })) ||
                    (path.indexOf('SBIS3.') === -1 && path.indexOf('/') > -1) && path.indexOf('Control/') === -1) {
                    result = requireModules(loadDfr, path);
                }
                else {
                    result = requireModules(loadDfr, path);
                }
                return result;
            }
            function getPathLoadersPDef(configsPaths, needCtors) {
                return configsPaths.reduce(function (pDef, cfgPath) {
                    var path_ = cfgPath[0], path, loader;
                    if (!(path_ in loadedPaths)) {
                        loadedPaths[path_] = true;
                        loader = loaderForPath(path_, needCtors);
                        pDef.push(loader());
                    }
                    return pDef;
                }, new ParallelDeferred()).done().getResult();
            }
            function resolveDepsAsControlConfigs(configsPaths) {
                var DepResolver = require.defined('Core/DependencyResolver') ? require('Core/DependencyResolver') : false;
                return configsPaths.reduce(function (result, cfgPath) {
                    var path = cfgPath[0], cfg = cfgPath[1], deps;
                    deps = DepResolver && DepResolver.resolve(path, cfg) || [];
                    deps.forEach(function (dep) {
                        result.push([dep, cfg]);
                    });
                    return result;
                }, []);
            }
            function constructorsForAllConfigs(configsPaths, pathsConstructors) {
                var hash = Object.keys(pathsConstructors).reduce(function (result, pathConstr) {
                    var path = pathsConstructors[pathConstr];
                    result[path[0]] = path[1];
                    return result;
                }, {});
                return configsPaths.map(function (cfgPath) {
                    var path = cfgPath[0], ctor = hash[path];
                    if (resolveCtors && typeof ctor !== 'function') {
                        throw new Error("Can't instantiate class '" + path + "'. Class not exists");
                    }
                    return ctor;
                });
            }
            function loadPaths(configsPaths, resolveCtors) {
                var loadersPDef = getPathLoadersPDef(configsPaths, resolveCtors);
                return loadersPDef.addCallback(function (pathsConstructors) {
                    var depConfigs = resolveDepsAsControlConfigs(configsPaths), result;
                    if (depConfigs.length > 0) {
                        result = loadPaths(depConfigs, false).addCallback(function () {
                            return pathsConstructors;
                        });
                    }
                    else {
                        result = pathsConstructors;
                    }
                    return result;
                });
            }
            return loadPaths(configsPaths, resolveCtors).addCallback(constructorsForAllConfigs.bind(undefined, configsPaths));
        },
        /**
         * Возвращает результат загрузки всех функций используемых в шаблоне
         * @return {Core/Deferred} результат загрузки
         */
        getRenderResult: function () {
            return this._dReady.getResult();
        },
        /**
         * Возвращает стиль окна, заданный при проектировании
         */
        getStyle: function () {
            throw new Error("Template::getStyle - method is not implemented!");
        },
        /**
         * @returns {Object} Объект с параметрами width и height
         */
        getDimensions: function () {
            throw new Error("Template::getDimensions - method is not implemented!");
        },
        /**
         * @returns {Object} объект { h: String, w: String } с параметрами выравнивания ws-area
         */
        getAlignment: function () {
            throw new Error("Template::getAlignment - method is not implemented!");
        },
        /**
         * @returns {String} заголовок окна
         */
        getTitle: function () {
            throw new Error("Template::getTitle - method is not implemented!");
        },
        /**
         * @return {object} конфиг окна прописанный в шаблоне
         */
        getConfig: function (node) {
            throw new Error("Template::getConfig - method is not implemented!");
        },
        /**
         * @returns {Object} Хэш-мэп событий, и подписантов на них. Подписанты передаются в виде массива
         */
        getDeclaredHandlers: function () {
            return this._loadedHandlers;
        },
        createMarkup: function (container) {
            throw new Error("Template::createMarkup - method is not implemented!");
        },
        /**
         * @param {String} parentId
         * @param {jQuery} templateRoot корневой элемент, в который встроен текущий шаблон
         * @returns {Object} параметры и типы контролов, присутствующих в шаблоне
         */
        getControls: function (parentId, templateRoot) {
            throw new Error("Template::getControls - method is not implemented!");
        },
        getName: function () {
            return this._templateName;
        },
        _getIncludeDescriptorNodes: function () {
            throw new Error("Template::_getIncludeDescriptorNodes - method is not implemented!");
        },
        _attachResources: function () {
            var include = this._getIncludeDescriptorNodes(), pdResult = new ParallelDeferred();
            if (include.length > 0) {
                // Не может быть несколько инклюдов... Всегда берем первый
                var spec = include[0].getAttribute('spec');
                if (spec) {
                    try {
                        spec = JSON.parse(spec);
                    }
                    catch (e) {
                        spec = false;
                    }
                    if (spec) {
                        if (spec.js) {
                            pdResult.push(this._requireModuleUrls(spec.js));
                        }
                        if (spec.css) {
                            pdResult.push(this._requireModuleUrls(spec.css));
                        }
                    }
                }
            }
            return pdResult.done().getResult();
        },
        _requireModuleUrls: function (modules) {
            var defer = new Deferred();
            defer.addErrback(function (e) {
                return e;
            });
            require(modules, function () {
                defer.callback();
            }, function (err) {
                defer.errback(err);
            });
            return defer;
        },
        _mergeAttrToConfig: function (config, attrName, attrValue) {
            if (attrName !== 'title' && attrName !== 'width' && attrName !== 'height') {
                config[attrName] = attrValue === 'false' ? false : (attrValue === 'true' ? true : attrValue);
            }
        },
        needSetZindexByOrder: function () {
            return false;
        }
    });
    Template._importNode = function (document, node, allChildren, compat) {
        /**
         * Adopted from http://www.alistapart.com/articles/crossbrowserscripting/
         * by elifantievon
         */
        if (compat !== false && document.importNode) {
            try {
                return document.importNode(node, allChildren);
            }
            catch (e) {
                compat = false;
            }
        }
        switch (node.nodeType) {
            case nodeType.ELEMENT_NODE:
                var newNode = document.createElement(node.nodeName), i, il;
                /* does the node have any attributes to add? */
                if (node.attributes && node.attributes.length > 0) {
                    for (i = 0, il = node.attributes.length; i < il; i++) {
                        var attrName = node.attributes[i].nodeName, value = node.getAttribute(attrName);
                        if (attrName.toLowerCase() === 'style' && Env.compatibility.isIE) {
                            newNode.style.cssText = value;
                        }
                        else {
                            newNode.setAttribute(attrName, value);
                        }
                    }
                }
                /* are we going after children too, and does the node have any? */
                if (allChildren && node.childNodes && node.childNodes.length > 0) {
                    for (i = 0, il = node.childNodes.length; i < il; i++) {
                        var importedChild = Template._importNode(document, node.childNodes[i], allChildren, compat);
                        if (importedChild) {
                            newNode.appendChild(importedChild);
                        }
                    }
                }
                return newNode;
            case nodeType.TEXT_NODE:
            case nodeType.CDATA_SECTION_NODE:
                return document.createTextNode(node.nodeValue);
            case nodeType.COMMENT_NODE:
                return null;
        }
    };
    Template.extend = function(mixinsList, classExtender) {
        return coreExtend(this, mixinsList, classExtender);
    };
    return Template;
});
