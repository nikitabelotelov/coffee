define('lib/Control/AreaAbstract/AreaAbstract.json',[],function(){return {"name":"AreaAbstract","title":"Абстрактная область-контейнер","initial":"","icon":"","category":"","requires":["Lib/Control/AreaAbstract/AreaAbstract"],"properties":{"ws-config":{"title":"Базовая конфигурация","options":{"allowChangeEnable":{"title":"Разрешено изменение состояния","type":"Boolean","default":true},"className":{"title":"Дополнительные классы контейнера","default":""},"context":{"title":"Контекст","type":"$ws.proto.Context","default":false},"enabled":{"title":"Активность","type":"Boolean","default":true},"extendedTooltip":{"title":"Текст расширенной подсказки, отображаемой во всплывающей панельке (Infobox)","type":"String|Boolean","default":false},"name":{"title":"Имя контрола, для привязки к данным","default":""},"owner":{"title":"Владелец компонента","type":"Object","default":null},"record":{"title":"Заменить контекст ( $ws.proto.Context )","type":"Object","default":false},"saveState":{"title":"Сохранять состояние","type":"Boolean","default":false},"tooltip":{"title":"Текст всплывающей подсказки","default":"","translatable":true},"visible":{"title":"Видимость компонента","type":"Boolean","default":true}}},"ws-handlers":{"title":"Обработчики","options":{"onActivate":{"title":"При переходе фокуса в область","editor":"handler"},"onChange":{"title":"Событие при изменении","editor":"handler"},"onClick":{"title":"Событие при клике на контрол","editor":"handler"},"onDestroy":{"title":"Событие при уничтожении","editor":"handler"},"onFocusIn":{"title":"Событие при установке фокуса на контрол","editor":"handler"},"onFocusOut":{"title":"Событие при потере фокуса","editor":"handler"},"onInit":{"title":"Событие при инициализации","editor":"handler"},"onKeyPressed":{"title":"Событие при нажатии клавиш","editor":"handler"},"onReady":{"title":"При полной готовности области(все контролы внутри уже построились)","editor":"handler"},"onResize":{"title":"При изменении размеров контейнера","editor":"handler"},"onSizeChanged":{"title":"Событие при изменении размеров","editor":"handler"},"onStateChanged":{"title":"Событие при изменении состояния контрола","editor":"handler"},"onTooltipContentRequest":{"title":"Получение содержимого расширенной подсказки поля","editor":"handler"}}}}};});