define('Core/core-clone', [
    'Core/core-merge'
    ], function(
        coreMerge
) {

   /**
    * Клонирует объект или массив.
    * На основе <strong>'Core/core-merge'</strong>.
    *
    * <h2>Пример использования</h2>
    * <pre>
    * require(['Core/core-clone'], function(clone) {
    *    var originOne = {one: 1, two: 2, three: 3};
    *    var originTwo = ['one', 'two', 'three'];
    *    var cloneOne = clone(originOne);
    *    var cloneTwo = clone(originTwo);
    *    console.log(cloneOne.two); // 2
    *    console.log(cloneTwo[2]); // 'three'
    * });
    * </pre>
    *
    * @class Core/core-clone
    * @public
    */

    /**
     * Функция, клонирующая объект или массив. Сделана на основе <strong>'Core/core-merge'</strong>.
     * @param hash Исходный объект или массив.
     * @return {Object} Клонированный объект или массив.
     */
    return function(hash) {
        hash = {v: hash};
        var result = coreMerge({}, hash, {clone: true});
        return result.v;
    };
});