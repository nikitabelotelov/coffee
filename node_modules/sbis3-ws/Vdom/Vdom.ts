/// <amd-module name="Vdom/Vdom" />

import * as Debug from './_private/Synchronizer/resources/Debug';
import * as DirtyChecking from './_private/Synchronizer/resources/DirtyChecking';
import * as DirtyCheckingCompatible from './_private/Synchronizer/resources/DirtyCheckingCompatible';
import * as Hooks from './_private/Synchronizer/resources/Hooks';
import * as SwipeController from './_private/Synchronizer/resources/SwipeController';
import * as TabIndex from './_private/Synchronizer/resources/TabIndex';
import * as VdomMarkup from './_private/Synchronizer/resources/VdomMarkup';

import * as DefaultOpenerFinder from './_private/Utils/DefaultOpenerFinder';
import * as Focus from './_private/Utils/Focus';
import * as Functional from './_private/Utils/Functional';
import * as Monad from './_private/Utils/Monad';

// @ts-ignore
import { IoC } from 'Env/Env';

export { default as Synchronizer } from './_private/Synchronizer/Synchronizer';
export { Debug };
export { DirtyChecking };
export { DirtyCheckingCompatible };
export { default as DOMEnvironment } from './_private/Synchronizer/resources/DOMEnvironment';
export { default as Environment } from './_private/Synchronizer/resources/Environment';
export { Hooks };
export { default as runDelayedRebuild, animationWaiter } from './_private/Synchronizer/resources/runDelayedRebuild';
export { SwipeController };
export { default as SyntheticEvent } from './_private/Synchronizer/resources/SyntheticEvent';
export { TabIndex };
export { VdomMarkup };

export { DefaultOpenerFinder, Focus, Functional, Monad };

export function logDeprecatedWrapper(oldModuleName, newFieldName) {
   IoC.resolve('ILogger').warn(
      'Vdom/Vdom',
      `"${oldModuleName}" wrapper is deprecated and will be removed. Require ` +
      `"Vdom/Vdom" and use ${newFieldName} from it instead.`
   );
}
