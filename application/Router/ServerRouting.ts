/// <amd-module name="Router/ServerRouting" />

// TODO Move this file to Presentation Service?
import { getAppNameByUrl } from 'Router/MaskResolver';

let _baseTemplate = 'wml!Controls/Application/Route';

export function getAppName(request): string {
   return getAppNameByUrl(request.path);
}

export function renderApp(request, response, appName): void {
   request.compatible = false;
   response.render(_baseTemplate, {
      application: appName
   });
}

export function setBaseTemplate(newBaseTemplate) {
   _baseTemplate = newBaseTemplate;
}
