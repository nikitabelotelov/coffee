/// <amd-module name="Env/_Event/Object" />
 /**
  *
  * @class Env/_Event/Object
  * @author Мальцев А.А.
  * @public
  */
export default class EventObject {
   name: string;
   _isBubbling: boolean = true;
   _result: any;
   _eventName: string = null;
   _target: any = null;
   constructor(eventName, target) {
      this.name = this._eventName = eventName;
      this._target = target;
   }
   
   /**
    * Отменить дальнейшую обработку
    */
   cancelBubble() {
      this._isBubbling = false;
   }

   /**
    * Будет ли продолжена дальнейшая обработка
    * @returns {Boolean}
    */
   isBubbling() {
      return this._isBubbling;
   }

   /**
    * Возвращает результат
    * @returns {*}
    */
   getResult() {
      return this._result;
   }
   
   /**
    * Устанавливает результат
    * @param {*} r
    */
   setResult(r) {
      this._result = r;
   }

   /**
    * Возвращает объект, инициировавший событие
    * @returns {*}
    */
   getTarget() {
      return this._target;
   }
};
