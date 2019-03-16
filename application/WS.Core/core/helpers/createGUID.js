define('Core/helpers/createGUID', ['Types/entity', 'Env/Env'], function (entity, Env) {
   "use strict"
   /**
    * Создает "GUID".
    * @remark
    * @deprecated используйте Types/entity:Guid
    * В кавычках потому, что он не настоящий, только выглядит как GUID. Используется свой аглоритм, не такой как настоящий.
    * @returns {String} "GUID"
    * @see generateURL
    * @see generatePageURL
    * @see randomId
    */

  if (typeof window !== 'undefined' && Env.IoC.has('ILogger')) {
      Env.IoC.resolve('ILogger').warn('Core/helpers/createGUID', 'Модуль устарел и будет удален используйте Types/entity:Guid');
   }
   return entity.Guid.create;
});
