/// <amd-module name="Browser/_Transport/RPC/fallback" />
// @ts-ignore
import Deferred = require('Core/Deferred');
import { Object as EventObject} from 'Env/Event';
import ITransport from 'Browser/_Transport/ITransport';
import { CallFunction, RequestParam } from './CallFunction';

const FALLBACK_EVENT_NAME = 'system.bl_async_replies';

type EventListenerContext = {
    timeout?: number; // Таймер ожидания события
    deferred: Deferred<any>; // Результирующий Deferred
    guid: string; // guid запроса
}
// @ts-ignore
type EventListener = (event: EventObject, rawData: any) => void;

let getEventListener = (context: EventListenerContext): EventListener => {
    // @ts-ignore
    return (event: EventObject, rawData: any) => {
        if (!rawData) {
            return;
        }
        let data;
        if (typeof rawData === 'string') {
            data = JSON.parse(rawData);
        }
        if (data && data.guid === context.guid) {
            clearTimeout(context.timeout);
            context.deferred.callback(data.data);
        }
    }
};

/**
 * @cfg {Browser/_Transport/ITransport} transport Транспорт, по которому будет осуществлён запрос
 */
/**
 * @cfg {String} data Тело запроса в виде строки.
 */
/**
 * @cfg {Object} headers Объект с необходимыми заголовками.
 */
/**
 * @cfg {Number} timeout Время ожидания ответа.
 * Значение устанавливается в мс.
 * При превышении этого времени в качестве результата возвращается errback с сообщение "Timeout".
 */

/**
 * Отправляет запрос на бизнес-логику без гарантии доставки, ожидающий ответ от сервиса в виде серверного-события
 * Подробнее о назначении вы можете прочитать в разделе
 * {@link http://wi.sbis.ru/doc/platform/developmentapl/cooperationservice/subscription-to-events-in-the-cloud/#fallback}
 * @name Browser/_Transport/RPC/fallback
 * @private
 * @author Заляев А.В
 */
let fallback: CallFunction = ({data, headers, transport, timeout}: RequestParam) => {
    let deferred = new Deferred();
    // @ts-ignore
    require(['Env/ServerEvent/Bus'], (ServerEventBus) => {
        let getChannel = () => ServerEventBus.serverChannel(FALLBACK_EVENT_NAME);
        
        getChannel().once('onReady', () => {
            let ctx: EventListenerContext = {
                deferred,
                guid: headers['X-UNIQ-ID']
            };
            
            let eventListener = getEventListener(ctx);
    
            // @ts-ignore
            ctx.timeout = setTimeout(() => {
                getChannel().unsubscribe('onMessage', eventListener);
                deferred.errback('Timeout');
            }, timeout);
            
            getChannel().subscribe('onMessage', eventListener);
            transport.execute(data, headers);
        });
    }, (error) => {
        deferred.errback(error);
    });
    return deferred;
};

export default fallback;
