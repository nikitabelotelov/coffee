/// <amd-module name="Router/History" />

import RouterHelper from 'Router/Helper';
import UrlRewriter from 'Router/UrlRewriter';

interface IHistoryState {
   id?: number;
   url: string;
   prettyUrl?: string;
}

class RouterHistoryManager {
   private _localHistory: IHistoryState[] = [];
   private _currentPosition = 0;

   constructor() {
      if (typeof window !== 'undefined') {
         const currentUrl = RouterHelper.getRelativeUrl();
         let firstStateId = 0;

         // window can already have state (for example if we reload the page
         // that has RouterController on it). In this case, copy the state
         // id and start local history with it
         if (window.history.state && typeof window.history.state.id === 'number') {
            firstStateId = window.history.state.id;
         }

         // Initialize local history by pushing the current state into it
         this._pushToHistory(
            firstStateId,
            UrlRewriter.get(currentUrl),
            currentUrl
         );

         // If window doesn't have state, set it to our current state
         if (!window.history.state) {
            window.history.replaceState(this.getCurrentState(), currentUrl, currentUrl);
         }
      }
   }

   public getCurrentState(): IHistoryState {
      return this._localHistory[this._currentPosition];
   }

   public getPrevState(): IHistoryState {
      return this._localHistory[this._currentPosition - 1];
   }

   public getNextState(): IHistoryState {
      return this._localHistory[this._currentPosition + 1]
   }

   public back(): void {
      if (this._currentPosition === 0) {
         const goToUrl = RouterHelper.getRelativeUrl(true);

         // Make new state the first state in local history and update
         // (increase) ids of states that are stored already
         let newState = this._generateHistoryObject(
            this.getCurrentState().id,
            UrlRewriter.get(goToUrl),
            goToUrl
         );
         this._localHistory.forEach(state => state.id++);

         // Save the new state in the start of the local history
         this._localHistory.unshift(newState);
      } else {
         this._currentPosition--;
      }

      RouterHelper.setRelativeUrl(this.getCurrentState().url);
   }

   public forward(): void {
      this._currentPosition++;
      if (this._currentPosition === this._localHistory.length) {
         const goToUrl = RouterHelper.getRelativeUrl();

         this._pushToHistory(
            this.getPrevState().id,
            UrlRewriter.get(goToUrl),
            goToUrl
         );
      }

      RouterHelper.setRelativeUrl(this.getCurrentState().url);
   }

   public push(newUrl: string, newPrettyUrl: string): void {
      let newStateId;
      if (this.getCurrentState()) {
         newStateId = this.getCurrentState().id + 1;
      } else {
         newStateId = 0;
      }

      this._currentPosition++;
      this._localHistory.splice(this._currentPosition);
      this._pushToHistory(
         newStateId,
         newUrl,
         newPrettyUrl
      );

      RouterHelper.setRelativeUrl(newUrl);
      window.history.pushState(this.getCurrentState(), newPrettyUrl, newPrettyUrl);
   }

   private _generateHistoryObject(id: number, url: string, prettyUrl: string): IHistoryState {
      return {
         id,
         url,
         prettyUrl
      };
   }

   private _pushToHistory(id: number, url: string, prettyUrl: string): void {
      this._localHistory.push(this._generateHistoryObject(id, url, prettyUrl));
   }
}

export default new RouterHistoryManager();