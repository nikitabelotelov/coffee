/// <amd-module name="Types/_source/provider/INotify" />
/**
 * Интерфейс провайдера c доступом к серверным событиям
 * @interface Types/_source/provider/INotify
 * @public
 * @author Мальцев А.А.
 * @example
 * <pre>
 *    require(['Types/source', 'Core/core-instance'], function(source, coreInstance) {
 *       //...
 *       if (dataSource instanceof source.Remote) {
 *          var provider = dataSource.getProvider();
 *          if (coreInstance.instanceOfMixin(provider, 'Types/_source/provider/INotify') {
 *             provider.getEventsChannel().subscribe('onMessage', function(event, message) {
 *                console.log('A message from the server: ' + message);
 *             });
 *          }
 *       }
 *    });
 * </pre>
 * @example
 * <pre>
 *    dataSource.getProvider().getEventsChannel('ErrorLog').subscribe('onMessage', function(event, message) {
 *       console.error('Something went wrong: ' + message);
 *    });
 * </pre>
 */
define('Types/_source/provider/INotify', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
});