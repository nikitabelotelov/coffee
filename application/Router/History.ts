/// <amd-module name="Router/History" />

import * as UrlRewriter from 'Router/UrlRewriter';
import * as Data from 'Router/Data';

export function getPrevState(): Data.IHistoryState {
   return Data.getHistory()[Data.getHistoryPosition() - 1];
}
export function getCurrentState(): Data.IHistoryState {
   return Data.getHistory()[Data.getHistoryPosition()];
}
export function getNextState(): Data.IHistoryState {
   return Data.getHistory()[Data.getHistoryPosition() + 1];
}

export function back(): void {
   const history = Data.getHistory();
   const historyPosition = Data.getHistoryPosition();

   if (historyPosition === 0) {
      const currentUrl = Data.getVisibleRelativeUrl();
      history.unshift({
         id: history[0].id - 1,
         state: UrlRewriter.get(currentUrl),
         href: currentUrl
      });
   } else {
      Data.setHistoryPosition(historyPosition - 1);
   }

   _updateRelativeUrl();
}
export function forward(): void {
   const history = Data.getHistory();
   const newHistoryPosition = Data.getHistoryPosition() + 1;

   Data.setHistoryPosition(newHistoryPosition);
   if (newHistoryPosition === history.length) {
      const currentUrl = Data.getRelativeUrl();
      history.push({
         id: history[newHistoryPosition - 1].id + 1,
         state: UrlRewriter.get(currentUrl),
         href: currentUrl
      });
   }

   _updateRelativeUrl();
}

export function push(newState: Data.IHistoryState): void {
   const history = Data.getHistory();
   const historyPosition = Data.getHistoryPosition();

   // remove all states after the current state
   history.length = historyPosition + 1;

   // add new history state to the store
   newState.id = history[historyPosition].id + 1;
   history.push(newState);
   Data.setHistoryPosition(historyPosition + 1);

   // update the URL
   _updateRelativeUrl();
   const displayUrl = newState.href || newState.state;
   window.history.pushState(newState, displayUrl, displayUrl);
}

function _updateRelativeUrl(): void {
   Data.setRelativeUrl(Data.getHistory()[Data.getHistoryPosition()].state);
}
