/// <amd-module name="Browser/_Transport/ITransport" />
// @ts-ignore
import * as coreExtend from 'Core/core-extend';

declare class Transport {
}
declare class TransportConstructor {
   new(...args): Transport;
   extend(obj: object);
}
/**
 * Абстрактный транспорт
 *
 * @class Transport/ITransport
 * @author Бегунов А.В.
 * @public
 */
let ITransport: TransportConstructor = coreExtend({}, /** @lends Transport/ITransport.prototype */{
   /**
    * Отправка запроса
    *
    * @param data данные
    * @param {Object} [headers] Заголовки запроса
    * @returns {Core/Deferred}
    */
   execute: function(data, headers) {
      throw new Error("Method not implemented");
   }
});

export default ITransport;
