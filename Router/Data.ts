/// <amd-module name="Router/Data" />

// @ts-ignore
import Request = require('View/Request');

import * as UrlRewriter from 'Router/UrlRewriter';

const STORAGE_KEY = 'RouterData';
const CORE_INSTANCE_KEY = 'CoreInstance';

export interface IHistoryState {
   id?: number;
   state: string;
   href?: string;
}

export type TStateChangeFunction = (newLoc: IHistoryState, oldLoc: IHistoryState) => Promise<any>;

export interface IRegisteredRoute {
   beforeUrlChangeCb: TStateChangeFunction;
   afterUrlChangeCb: TStateChangeFunction;
}

export interface IRegisteredReference {
   afterUrlChangeCb: TStateChangeFunction;
}

export interface IRouterData {
   IS_ROUTER_STORAGE: boolean;
   history: IHistoryState[];
   historyPosition: number;
   registeredRoutes: HashMap<IRegisteredRoute>;
   registeredReferences: HashMap<IRegisteredReference>;
   coreInstance?: any;
   relativeUrl: string;
}

export function getHistory(): IHistoryState[] {
   return _getField('history');
}

export function setHistory(value: IHistoryState[]): void {
   _setField('history', value);
}

export function getHistoryPosition(): number {
   return _getField('historyPosition');
}

export function setHistoryPosition(value: number): void {
   _setField('historyPosition', value);
}

export function getRelativeUrl(): string {
   return _getField('relativeUrl') || _calculateRelativeUrl();
}

export function setRelativeUrl(value: string): void {
   _setField('relativeUrl', value);
}

export function getVisibleRelativeUrl(): string {
   return _calculateRelativeUrl();
}

export function getRegisteredRoutes(): HashMap<IRegisteredRoute> {
   return _getField('registeredRoutes');
}

export function getRegisteredReferences(): HashMap<IRegisteredReference> {
   return _getField('registeredReferences');
}

export function getCoreInstance(): any {
   return _getCoreInstance();
}

function _initNewStorage(storage: any): void {
   const currentUrl = _calculateRelativeUrl();
   const initialHistoryState: IHistoryState = {
      id: 0,
      state: UrlRewriter.get(currentUrl),
      href: currentUrl
   };

   if (typeof window !== 'undefined') {
      if (window.history.state && typeof window.history.state.id === 'number') {
         initialHistoryState.id = window.history.state.id;
      } else if (!window.history.state) {
         window.history.replaceState(initialHistoryState, initialHistoryState.href, initialHistoryState.href);
      }
   }

   const initialStorage: IRouterData = {
      IS_ROUTER_STORAGE: true,
      history: [initialHistoryState],
      historyPosition: 0,
      registeredRoutes: {},
      registeredReferences: {},
      relativeUrl: initialHistoryState.state
   };
   Object.assign(storage, initialStorage);
}

function _getStorage(): IRouterData {
   const currentRequest = Request.getCurrent();
   const storage = currentRequest && currentRequest.getStorage(STORAGE_KEY);
   if ((currentRequest && !storage) || (storage && !storage.IS_ROUTER_STORAGE)) {
      _initNewStorage(storage);
   }
   return storage;
}

function _calculateRelativeUrl(): string {
   const currentRequest = Request.getCurrent();
   const location = currentRequest && currentRequest.location;

   if (location) {
      return location.pathname + location.search + location.hash;
   } else {
      return null;
   }
}

function _getCoreInstance(): any {
   const currentRequest = Request.getCurrent();
   const storage = currentRequest && currentRequest.getStorage(CORE_INSTANCE_KEY);
   return storage && storage.instance;
}

function _getField(fieldName: string): any {
   return _getStorage()[fieldName];
}

function _setField(fieldName: string, value: any): any {
   const storage = _getStorage();
   return (storage[fieldName] = value);
}
