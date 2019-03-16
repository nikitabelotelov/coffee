/// <amd-module name="Core/helpers/Array/remove" />

export = function remove(arr, index, count) {
   const resCount = count || 1;
   if (!(arr instanceof Array)) {
      throw new TypeError('Incorrect type of the first arguments. Array expected');
   }
   return arr.splice(index, resCount);
}
