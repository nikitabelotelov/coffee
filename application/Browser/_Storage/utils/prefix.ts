/// <amd-module name="Browser/_Storage/utils/prefix" />
/**
 * Добавляет префикс к строке
 * @param {String} str
 * @param {String} prefix
 * @return {String}
 */
export let add = (str: string, prefix: string): string => {
    return prefix && (prefix + "/" + str) || str;
};

/**
 * Возвращает строку без профекса
 * @param {String} str
 * @param {String} prefix
 * @return {String}
 */
export let remove = (str: string, prefix: string) : string => {
    return prefix && startsWith(str, prefix) ? str.substr(prefix.length + 1) : str;
};

/**
 * Проверка начинается ли строка с конструкциюи вида prefix/, если передан префикс.
 * в случае отсуствия префикса вернёт true
 * @param {String} str
 * @param {String} prefix
 * @return {Boolean}
 */
export let startsWith = (str: string, prefix: string): boolean => {
    return !prefix || str.indexOf(prefix + "/") === 0;
};
