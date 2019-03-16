define('Browser/_TransportOld/loadTemplateFile', [
    'Core/Deferred',
    'Env/Env',
    'Core/Storage',
    'Browser/_TransportOld/nodeType',
], function (Deferred, Env, Storage, nodeType) {
    /**
     * Асинхронная загрузка XML-документа с шаблоном.
     * Для каждого файла непосредственно загрузка будет выполняться только один раз
     *
     * @param {String} templateName имя шаблона или путь (если начинается с . или /)
     * @param {Boolean} [fast]
     * @returns {Core/Deferred}
     */
    return function loadTemplateFile(templateName, fast) {
        /**
         * Функция, запрашивающая шаблон.
         * @param {String} file конкретное абсолютное имя файла шаблона
         * @return {Core/Deferred}
         */
        function requestTemplateFile(file) {
            //проверяем загружался ли хоть 1 из пакетов содержащий нужный шаблон, если нет - берем последний
            if (!fast && file instanceof Array) {
                for (var i = 0, l = file.length; i < l; i++) {
                    if (Storage.isStored('resfile://' + file[i]) || i == l - 1) {
                        file = file[i];
                        break;
                    }
                }
            }
            var rid = typeof document !== 'undefined' && (Env.cookie.get('s3rh') || Env.cookie.get('rightshash')) || 0;
            return Storage.store('resfile://' + file, function (dResult) {
                dResult.dependOn(Env.IoC.resolve('ITransport', {
                    dataType: fast ? 'text' : 'xml',
                    url: (function () {
                        // При запросе XML допишем к версии идентификатор прав (передаваемый в cookie)
                        var res = file + (fast ? '.fast.xml' : '.xml');
                        if (rid) {
                            res = res.replace(/(\.fast)?(\.v[0-9a-f]+)?(\.l[\S-]+)?(\.xml)$/, '$1.r' + rid + '$2$3$4');
                        }
                        return res;
                    })()
                }).execute(null));
            });
        }
        // Если ресурс пакетирован - грузим пакет и ищем там
        if (Env.constants.xmlPackages[templateName] && !fast) {
            return new Deferred().dependOn(requestTemplateFile(Env.constants.xmlPackages[templateName]))
                .addCallback(function (res) {
                    var root = res.documentElement;
                    for (var j = root.childNodes.length - 1; j >= 0; --j) {
                        if (root.childNodes[j].nodeType != nodeType.ELEMENT_NODE) {
                            continue;
                        }
                        if (root.childNodes[j].getAttribute('id') == templateName) {
                            return root.childNodes[j];
                        }
                    }
                    return new Error(templateName + ' is not found in the package ' + Env.constants.xmlPackages[templateName]);
                });
        }
        // Иначе работаем по старой схеме
        var firstChar = templateName.charAt(0), base = '';
        // Если первый символ . или / - значит это путь. Грузим его непосредственно. В противном случае
        // это или ресурс движка или ресурс по оглавлению
        if (firstChar !== '/' && firstChar !== '.') {
            // Проверим есть ли в оглавлении
            if (templateName in Env.constants.xmlContents) {
                templateName = Env.constants.xmlContents[templateName];
                firstChar = templateName.charAt(0);
                if (firstChar !== '/') {
                    // Если у нас не абсолютный путь
                    base = Env.constants.resourceRoot;
                }
            }
            else {
                // если нет - грузим из ресурсов движка
                base = Env.constants.wsRoot + 'res/xml/';
            }
        }
        return requestTemplateFile(base + templateName);
    }
});
