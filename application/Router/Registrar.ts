/// <amd-module name="Router/Registrar" />

class Registrar {
   private _registry: any = null;

   constructor() {
      this._registry = {};
   }

   public register(event: Event, component: any, callback:Function): void {
      this._registry[component.getInstanceId()] = {
         component: component,
         callback: callback
      };
      event.stopPropagation();
   }

   public unregister(event: Event, component: any): void {
      delete this._registry[component.getInstanceId()];
      event.stopPropagation();
   }

   public startAsync(objectNew: any, objectOld: any): Promise<any>{
      if (!this._registry) {
         return;
      }
      const promises = [];
      for (let i in this._registry) {
         if (this._registry.hasOwnProperty(i)) {
            let obj = this._registry[i];
            let res = obj && obj.callback.apply(obj.component, arguments);
            promises.push(res);
         }
      }

      return Promise.all(promises);
   }
}

export default Registrar;
