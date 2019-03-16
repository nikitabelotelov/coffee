define('Browser/_TransportOld/attachTemplate', [
    'Core/Deferred',
    'Env/Env',
    'Core/Storage',
    'Browser/_TransportOld/EmptyTemplate',
    'Browser/_TransportOld/FastTemplate',
    'Browser/_TransportOld/XMLTemplate',
    'Browser/_TransportOld/CompoundControlTemplate',
    'Browser/_TransportOld/loadTemplateFile'
], function (Deferred, Env, Storage, EmptyTemplate, FastTemplate, XMLTemplate, CompoundControlTemplate, loadTemplateFile) {
    var attach;
    function addXmlLog(templateName) {
        // @ts-ignore
        var tplListElem = $('#xmlContent');
        if (!tplListElem.length) {
            // @ts-ignore
            tplListElem = $('<div id="xmlContent" style="display:none; visibility: hidden;"></div>');
            // @ts-ignore
            $('body').append(tplListElem);
        }
        if (!tplListElem.data(templateName)) {
            tplListElem.data(templateName, true);
            tplListElem.append('<div name="' + templateName + '">');
        }
    }
    /**
     * Асинхронная загрузка инстанса класса SBIS3.CORE.Template
     * Для каждого не первого вызова будет отдаваться ранее созданный инстанс
     *
     * @param {String} templateName имя шаблона
     * @param {Object} [options]
     * @param {Boolean} [options.fast=false]
     * @param {String} [options.html='']
     * @returns {Core/Deferred}
     */
    function attachTemplate(templateName, options) {
        var res, fast = false, html = '', result = new Deferred();
        if (options && typeof options == 'object') {
            fast = options.fast || false;
            html = options.html || '';
        }
        else {
            fast = arguments[1];
            html = arguments[2];
        }
        Storage.store('res://' + templateName, function (dResult) {
            function createTpl(transportTemplate, cont, tplName) {
                dResult.callback({
                    transportTemplate: transportTemplate,
                    templateXML: cont,
                    template: cont,
                    templateName: tplName
                });
            }
            var coreModules = ['Deprecated', 'Lib'],
                moduleName = templateName.indexOf('/') > 0 ? templateName.split('/')[0] : false;
            if (
                (
                    coreModules.indexOf(moduleName) > -1 ||
                    Env.constants.modules.hasOwnProperty(moduleName)
                ) || (
                    templateName[0] !== '.' &&
                    templateName.indexOf('SBIS3.') === -1 &&
                    templateName.indexOf('/') > -1
                )
            ) {
                // @ts-ignore
                require([templateName], function (constructor) {
                    createTpl(CompoundControlTemplate, constructor, templateName);
                }, function (e) {
                    dResult.errback(e);
                });
            }
            else if (fast && html) {
                createTpl(FastTemplate, html, templateName);
            }
            else if (templateName) {
                loadTemplateFile(templateName, fast).addCallbacks(function (content) {
                    createTpl(fast ? FastTemplate : XMLTemplate, content, templateName);
                    addXmlLog(templateName);
                    return content;
                }, function (error) {
                    dResult.errback(error);
                    return error;
                });
            }
            else {
                createTpl(EmptyTemplate, '', '');
            }
        }).addCallbacks(function (cfg) {
            var transportTemplate = cfg.transportTemplate;
            if (typeof transportTemplate == 'string') {
                // @ts-ignore
                transportTemplate = require(transportTemplate);
            }
            var templateInstance = new transportTemplate(cfg);
            templateInstance.getRenderResult().addCallback(function () {
                result.callback(templateInstance);
            }).addErrback(function (e) {
                result.errback(new Error('attachTemplate: ' + e.message));
            });
            return cfg;
        }, function (error) {
            result.errback(error);
            return error;
        });
        return result;
    }
    return attach = {
        attachTemplate: attachTemplate,
        loadTemplateFile: loadTemplateFile
    };
});
