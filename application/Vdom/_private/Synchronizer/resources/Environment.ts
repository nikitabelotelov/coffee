/// <amd-module name="Vdom/_private/Synchronizer/resources/Environment" />

// @ts-ignore
import * as coreExtend from 'Core/core-extend';

const Environment = coreExtend.extend({
   constructor: function (controlStateChangedCallback, rootAttrs) {
      this._controlStateChangedCallback = controlStateChangedCallback;
      this._rebuildIgnoreId = null;
      // if (rootAttrs) {
      //    this._rootMapper = Utils.mapVNode.bind(_, Utils.setAttributes.bind(_, rootAttrs));
      // }
   },
   destroy: function () {
      // Clean up the saved stateChanged handler so it (and its closure)
      // don't get stuck in memory
      this._controlStateChangedCallback = null;
      this._destroyed = true;
   }
});

var proto = Environment.prototype;

proto.forceRebuild = function (id) {
   if (this._rebuildIgnoreId !== id && this._controlStateChangedCallback) {
      this._controlStateChangedCallback(id);
   }
};

proto.setRebuildIgnoreId = function (id) {
   this._rebuildIgnoreId = id;
};

proto.needWaitAsyncInit = function () {
   return false;
};

proto.setupControlNode = function (controlNode) {
   controlNode.environment = this;
   controlNode.control._saveEnvironment(this, controlNode);
};

proto.decorateRootNode = function (vnode) {
   return this._rootMapper ? this._rootMapper(vnode) : vnode;
};

export default Environment;
