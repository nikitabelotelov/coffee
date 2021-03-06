/// <amd-module name="Core/core-merge" />
define("Core/core-merge", ["require", "exports"], function (require, exports) {
    "use strict";
    function isMergeableObject(o) {
        return o && ((o.constructor === Object && !('$constructor' in o)) || o.constructor === Array);
    }
    function cloneOrCopy(hash, hashExtender, key, cfg, path) {
        /**
         * Если к нам пришел объект и можно клонировать
         * Запускаем мерж того, что пришло с пустым объектом (клонируем ссылочные типы).
         */
        if ((typeof (hashExtender[key]) === 'object' && hashExtender[key] !== null) && cfg.clone) {
            if (isMergeableObject(hashExtender[key])) {
                hash[key] = merge(hashExtender[key] instanceof Array ? [] : {}, hashExtender[key], cfg, key, path);
            }
            else {
                hash[key] = hashExtender[key];
            }
        }
        /**
         * Иначе (т.е. это
         *  ... не объект (простой тип) или
         *  ... запрещено клонирование)
         *
         * Если к нам пришел null и запрещено им заменять - не копируем.
         */
        else if (!(hashExtender[key] === null && cfg.noOverrideByNull)) {
            hash[key] = hashExtender[key];
        }
    }
    /**
     * Объединяет два объекта в один.
     *
     * <h2>Параметры функции</h2>
     * <ul>
     *     <li><b>hash</b> {Object} Исходный хэш.</li>
     *     <li><b>hashExtender</b> {Object} Хэш-расширение.</li>
     *     <li><b>cfg</b> {Object} Параметры.
     *        <ul>
     *           <li><b>preferSource</b> {Boolean=false} Сохранять или нет исходное значение.</li>
     *           <li><b>rec</b> {Boolean=true} Рекурсивное объединение.</li>
     *           <li><b>clone</b> {Boolean=false} Клонировать элементы или передавать по ссылке.</li>
     *           <li><b>create</b> {Boolean=true} Создавать элементы, отсутствующие в исходном объекте.</li>
     *           <li><b>noOverrideByNull</b> {Boolean=false} Запретить заменять исходные значения на null.</li>
     *           <li><b>ignoreRegExp</b> {String=''} Регулярное вырежения для игнорирования части свойств.</li>
     *        </ul>
     *     </li>
     * </ul>
     * <h2>Возвращает</h2>
     * {Object} Результат объединения (ссылку на hash).
     *
     * <h2>Пример использования</h2>
     * <pre>
     *    require(['Core/core-merge'], function(merge) {
     *       var original = {one: 1, two: 2};
     *       var extender = {two: 'dos', three: 'tres'};
     *       var allTogether = merge(original, extender);
     *       console.log(allTogether.one);//1
     *       console.log(allTogether.two);//'dos'
     *       console.log(allTogether.three);//'tres'
     *       //Исходный объект также модифицируется!
     *       console.log(original.two);//'dos'
     *    });
     * </pre>
     * @class Core/core-merge
     * @public
     */
    function merge(hash, hashExtender, cfg, currentKey, path) {
        if (cfg === undefined) {
            cfg = {};
        }
        cfg.preferSource = cfg.preferSource !== undefined ? cfg.preferSource : false; // не сохранять исходное значение
        cfg.rec = cfg.rec !== undefined ? cfg.rec : true; // объединять рекурсивно
        cfg.clone = cfg.clone !== undefined ? cfg.clone : false; // не клонировать элементы (передаем по ссылке)
        cfg.create = cfg.create !== undefined ? cfg.create : true; // создавать элементы, которых нет в исходном хэше
        cfg.noOverrideByNull = cfg.noOverrideByNull !== undefined ? cfg.noOverrideByNull : false; // не заменять значения null'овыми
        if (hashExtender instanceof Date) {
            if (cfg.clone) {
                return new Date(hashExtender);
            }
            hash = hashExtender;
            return hash;
        }
        if (!path) {
            path = path || { keys: [], objects: [] };
        }
        if (typeof (hash) === 'object' && hash !== null && typeof (hashExtender) === 'object' && hashExtender !== null) {
            path.keys.push(currentKey === undefined ? '.' : currentKey);
            if (path.objects.indexOf(hashExtender) > -1) {
                throw new Error("Recursive traversal detected for path \"" + path.keys.join(' -> ') + "\" with " + hashExtender);
            }
            path.objects.push(hashExtender);
            for (var i in hashExtender) {
                if (!hashExtender.hasOwnProperty(i)) {
                    continue;
                }
                if (cfg.ignoreRegExp && cfg.ignoreRegExp.test(i)) {
                    continue;
                }
                // Если индекса в исходном хэше нет и можно создавать
                if (hash[i] === undefined) {
                    if (cfg.create) {
                        if (hashExtender[i] === null) {
                            hash[i] = null;
                        }
                        else {
                            cloneOrCopy(hash, hashExtender, i, cfg, path);
                        }
                    }
                }
                else if (!cfg.preferSource) { // Индекс есть, исходное значение можно перебивать
                    if (hash[i] && typeof hash[i] === 'object' && typeof hashExtender[i] === 'object') {
                        // Объект в объект
                        if (hash[i] instanceof Date) {
                            if (hashExtender[i] instanceof Date) {
                                if (cfg.clone) {
                                    hash[i] = new Date(+hashExtender[i]);
                                }
                                else {
                                    hash[i] = hashExtender[i];
                                }
                                continue;
                            }
                            else {
                                // Исходный - дата, расщирение - нет. Сделаем пустышку в которую потом замержим новые данные
                                hash[i] = hashExtender[i] instanceof Array ? [] : {};
                            }
                        }
                        else if (hashExtender[i] instanceof Date) {
                            if (cfg.clone) {
                                hash[i] = new Date(+hashExtender[i]);
                            }
                            else {
                                hash[i] = hashExtender[i];
                            }
                            continue;
                        }
                        if (cfg.rec && (isMergeableObject(hashExtender[i]) || hashExtender[i] === null) && Object.keys(hash[i]).length > 0) {
                            hash[i] = merge(hash[i], hashExtender[i], cfg, i, path);
                        }
                        else {
                            hash[i] = hashExtender[i];
                        }
                    }
                    else { // Перебиваем что-то в что-то другое...
                        cloneOrCopy(hash, hashExtender, i, cfg, path);
                    }
                }
                /**
                 * Исходное значение имеет приоритет, но разрешена рекурсия
                 * Идем глубже.
                 */
                else if (typeof hash[i] === 'object' && typeof hashExtender[i] === 'object' && cfg.rec) {
                    if (isMergeableObject(hashExtender[i]) || hashExtender[i] === null) {
                        hash[i] = merge(hash[i], hashExtender[i], cfg, i, path);
                    }
                    else {
                        // Если это сложный объект мы ничего не делаем, т.к. сюда мы попадем только в том случае, если preferSource === true
                        // А значит нам нельзя здесь ничего перетирать
                    }
                }
            }
            path.keys.pop();
            path.objects.pop();
        }
        else if (!(hashExtender === null && cfg.noOverrideByNull) && !cfg.preferSource) {
            hash = hashExtender;
        }
        return hash;
    }
    return merge;
});
