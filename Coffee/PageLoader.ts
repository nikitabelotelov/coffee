/// <amd-module name="Coffee/PageLoader" />

// @ts-ignore
import {Control} from 'UI/Base';
// @ts-ignore
import template = require('wml!Coffee/PageLoader/PageLoader');


class PageLoader extends Control {
   public _template: Function = template;

   private pageClassLoaded: Function = null;
   private changePage(newPage: String, base: String): Promise<null> {
      return new Promise((resolve, reject) => {
         // @ts-ignore
         let basePath = base;
         if(base) {
            basePath = base + '/';
         }
         require(['Coffee/' + basePath + newPage], (newPageClass:Function) => {
            this.pageClassLoaded = newPageClass;
            resolve(null);
         })
      });
   }

   _beforeMount(cfg: any): Promise<null> {
      return this.changePage(cfg.pageId || cfg.default, cfg.base || '');
   }

   _beforeUpdate(newCfg: any): void {
      // @ts-ignore
      if (this._options.pageId !== newCfg.pageId) {
         this.changePage(newCfg.pageId || newCfg.default, newCfg.base || '').then(() => {
            // @ts-ignore
            this._forceUpdate();
         });
      }
   }
}

export = PageLoader;
