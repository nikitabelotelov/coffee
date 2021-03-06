(function() {
    'use strict';

    var logger = requirejs('Env/Env').IoC.resolve('ILogger');

    function DepGraph() {
        this._nodes = {};
        this._links = {};
        this._path = [];
        this._n = 0;
        this.smartNodes = [];
    }

    function getSplitter(exclude) {
        if (exclude.indexOf('SBIS') > -1) {
            return '.';
        } else {
            return '/';
        }
    }

    function compareWithNode(node, module) {
        var splitter = getSplitter(module);

        var
            nodeChunks = node.split(splitter),
            moduleChunks = module.split(splitter),
            isEqual = true;

        for (var i = 0; i < Math.min(nodeChunks.length, moduleChunks.length); i++) {
            var
                nChunk = nodeChunks[i],
                mChunk = moduleChunks[i];

            //Р•СЃР»Рё РёРјСЏ РјРѕРґСѓР»СЏ СѓРєР°Р·Р°РЅРѕ Р±РµР· РїР»Р°РіРёРЅР°, РѕС‚Р±СЂРѕСЃРёРј РїР»Р°РіРёРЅС‹ РѕС‚ РЅРѕРґС‹ С‚РѕР¶Рµ.
            if (mChunk.indexOf('!') == -1) {
                nChunk = nChunk.split('!').pop();
            }

            if (mChunk !== '*' && nChunk !== mChunk) {
                isEqual = false;
            }
        }

        return isEqual;
    }

    DepGraph.prototype._visitNode = function visitNode(maxLvl, name, smartCollect) {
        var self = this;
        if (this._path.length >= maxLvl) {
            return;
        }

        this._path.push(name);

        var
            nodes = this._nodes,
            links = this._links,
            node = nodes[name];




        if ((!smartCollect && self.firstLevelReached) || (smartCollect && node && self.firstLevelReached) ){
            delete(self.firstLevelReached);
        }

        if (smartCollect && !node) {

            self.smartNodes.push(name);
            nodes[name] = Object.create(null);
            node = nodes[name];
            self.firstLevelReached = true;
        }

        if (node) {
            if (node.mark > 0) {
                if (node.mark == 1) {
                   logger.log('WARNING! Cycle dependency detected: ' + this._path.join(', '));
                }
                this._path.pop();
                return;
            }

            node.mark = 1;

            (self.firstLevelReached ? [] : (links[name] || [])).forEach(function(dep) {
                visitNode.call(self, maxLvl,dep,  smartCollect);
            });
            node.mark = 2;
            node.weight = this._n++;
        } else if (name && name.indexOf('is!') > -1) {
            nodes[name] = {
                mark: 2,
                weight: this._n++,
                path: ''
            };
        } else if (name && name.indexOf('browser!') > -1) {
            visitNode.call(this, maxLvl, name.replace('browser!', ''));
        }

        this._path.pop();
    };


    /**
     * Р СѓРєРѕРІРѕРґСЃС‚РІСѓСЏСЃСЊ СЃС‚Р°СЂС‚РѕРІС‹РјРё РІРµСЂС€РёРЅР°РјРё startNodes
     * СЃС‚СЂРѕРёС‚ РјР°СЃСЃРёРІ РІСЃРµС… РІРµСЂС€РЅРёС… РІ СЃРѕРѕС‚РІРµС‚СЃС‚РІРёРё СЃ Р·Р°РІРёСЃРёРјРѕСЃС‚СЏРјРё.
     *
     * @param {Array} startNodes
     * @param {Number} [maxLevel=Infinity]
     * @returns {Array}
     */
    DepGraph.prototype.getLoadOrder = function(startNodes, maxLevel, smartCollect) {
        var self = this;

        maxLevel = maxLevel || Infinity;

        this._n = 0;

        if (!startNodes || !startNodes.length) {
            return [];
        }


        Object.keys(this._nodes).forEach(function(node) {
            // Fill meta
            self._nodes[node].mark = 0;
            self._nodes[node].weight = -1;
        });

        startNodes.forEach(function(node){
            self._visitNode.call(self,maxLevel, node, smartCollect);
        });


        //self.firstLevelReached = false;
        return Object.keys(this._nodes).map(function(k) {
            // node-name -> node (+ module name)
            var meta = self._nodes[k];
            meta.module = k;
            return meta;
        }).filter(function(node) {
            return node.weight >= 0;
        }).sort(function(a, b) {
            return a.weight - b.weight;
        });
    };

    DepGraph.prototype.addDependencyFor = function(name, deps) {
        if (this.hasNode(name)) {
            this._links[name] = deps;
        }
    };

    DepGraph.prototype.registerNode = function(name, meta) {
        this._nodes[name] = meta;
    };

    DepGraph.prototype.hasNode = function(name) {
        return name in this._nodes;
    };

    DepGraph.prototype.toJSON = function() {
        return JSON.stringify({
            nodes: this._nodes,
            links: this._links
        }, null, 2);
    };

    DepGraph.prototype.fromJSON = function(json) {
        var data = typeof json == 'string' ? JSON.parse(json) : json;
        this._nodes = data.nodes;
        this._links = data.links;
    };

    DepGraph.prototype.getDependenciesFor = function(name) {
        if (this.hasNode(name)) {
            return (this._links[name] || []).slice();
        } else {
            return [];
        }
    };

    DepGraph.prototype.getNodes = function() {
        return Object.keys(this._nodes);
    };

    DepGraph.prototype.getNodeMeta = function(node) {
        return this._nodes[node] || {};
    };

    DepGraph.prototype._deleteNodes = function(needToLoad, excludes) {
        var nodes = this.getNodes(),
            self = this;

        nodes.forEach(function (node) {
            excludes.forEach(function (excl) {
                if (needToLoad.indexOf(node) == -1) {
                    if (excl.indexOf('*') > -1) {
                        if (compareWithNode(node, excl)) {
                            delete self._nodes[node];
                        }
                    } else {
                        if (node == excl) {
                            delete self._nodes[node];
                        }
                    }
                }
            });
        });
    };

    DepGraph.prototype.getNodesToLoad = function (nodesList, excludes) {
        var nodes = this.getNodes(),
            needToLoad = [];

        nodes.forEach(function (node) {
            nodesList.forEach(function (nToLoad) {
                if (nToLoad.indexOf('*') > -1) {
                    if (compareWithNode(node, nToLoad)) {
                        needToLoad.push(node);
                    }
                } else {
                    if (node == nToLoad) {
                        needToLoad.push(node);
                    }
                }
            });
        });

        this._deleteNodes(needToLoad, excludes);
        return needToLoad;
    };

    module.exports = DepGraph;

})();
