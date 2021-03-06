/// <amd-module name="Types/_collection/IList" />
/**
 * Интерфейс списка - коллекции c доступом по индексу.
 * Основные возможности:
 * <ul>
 *    <li>получение элемента по индексу: {@link at};</li>
 *    <li>получение индекса по элементу: {@link getIndex};</li>
 *    <li>добавление элементов: {@link add}, {@link append}, {@link prepend};</li>
 *    <li>удаление элементов: {@link remove}, {@link removeAt}, {@link clear};</li>
 *    <li>замена элементов: {@link replace}, {@link assign};</li>
 *    <li>подсчет числа элементов: {@link getCount}.</li>
 * </ul>
 * @interface Types/_collection/IList
 * @public
 * @author Мальцев А.А.
 */
define('Types/_collection/IList', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
});