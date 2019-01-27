/// <amd-module name="Types/_entity/descriptor" />
/**
 * Модуль описания типа.
 * @class Types/Type/descriptor
 * @public
 * @author Мальцев А.А.
 */

/**
 * @typedef {Function} Chained
 * @property {Function} required Функция проверки обязательности
 * @property {Function} oneOf Функция проверки по списку разрешенных значений
 * @property {Function} arrayOf Функция проверки массива на тип значений
 */

declare type Descriptor = string | Function;

interface ValidateFunc {
   (value: any): any;
}

interface Chained extends ValidateFunc {
   required?: Chained
   oneOf?: Chained
   arrayOf?: Chained
}

/**
 * Normalizes type name.
 */
function normalizeType(type: Descriptor): Descriptor {
   if (typeof type === 'function') {
      switch (type) {
         case Boolean:
            type = 'boolean';
            break;
         case Number:
            type = 'number';
            break;
         case String:
            type = 'string';
            break;
      }
   }
   return type;
}

/**
 * Returns validator for certain type.
 * @name Types/Type/descriptor#validate
 * @param {Function|String} type Type descriptor.
 * @returns {Function} Validator.
 */
function validate(type: Descriptor): ValidateFunc {
   type = normalizeType(type);
   const typeName = typeof type;

   switch (typeName) {
      case 'string':
         return function validateTypeName(value) {
            if (value === undefined || typeof value === type || value instanceof String) {
               return value;
            }
            return new TypeError(`Value "${value}" should be type of ${type}`);
         };

      case 'function':
         return function validateTypeIntance(value) {
            // @ts-ignore
            if (value === undefined || value instanceof type) {
               return value;
            }
            return new TypeError(`Value "${value}" should be instance of ${type}`);
         };

      case 'object':
         return function validateTypeInterface(value) {
            if (value === undefined) {
               return value;
            }

            const mixins = value && value._mixins;
            if (mixins instanceof Array && mixins.indexOf(type) !== -1) {
               return value;
            }
            return new TypeError(`Value "${value}" should implement ${type}`);
         };
   }

   throw new TypeError(`Argument "type" should be one of following types: string, function or object but "${typeName}" received.`);
}

/**
 * Returns validator for required value.
 * @name Types/Type/descriptor#required
 * @returns {Chained} Validator
 */
function required(): Chained {
   const prev: Chained = this;

   return chain(function isRequired(value) {
      if (value === undefined) {
         return new TypeError('Value is required');
      }
      return prev(value);
   });
}

/**
 * Returns validator for "One of" restriction.
 * @name Types/Type/descriptor#oneOf
 * @param {Array} values Allowed values.
 * @returns {Chained} Validator.
 */
function oneOf(values: Array<any>): Chained {
   if (!(values instanceof Array)) {
      throw new TypeError('Argument values should be an instance of Array');
   }

   const prev: Chained = this;

   return chain(function isOneOf(value) {
      if (value !== undefined && values.indexOf(value) === -1) {
         return new TypeError(`Invalid value ${value}`);
      }
      return prev(value);
   });
}

/**
 * Returns validator for Array<T> restriction.
 * @name Types/Type/descriptor#oneOf
 * @param {Function|String} type Type descriptor.
 * @returns {Chained} Validator.
 */
function arrayOf(type: Descriptor): Chained {
   const prev: Chained = this;
   const validator = validate(type);

   return chain(function isArrayOf(value) {
      if (value !== undefined) {
         if (!(value instanceof Array)) {
            return new TypeError(`'Value "${value}" is not an Array`);
         }
         let valid;
         for (let i = 0; i < value.length; i++) {
            valid = validator(value[i]);
            if (valid instanceof Error) {
               return valid;
            }
         }
      }

      return prev(value);
   });
}

/**
 * Creates chain element with all available validators.
 * @name Types/Type/descriptor#chain
 * @param {Chained} parent Previous chain element.
 * @returns {Chained} New chain element.
 */
function chain(parent: Chained): Chained {
   const wrapper = (...args) => {
      return parent.apply(this, args);
   };

   Object.defineProperties(wrapper, {
      required: {
         enumerable: true,
         value: required
      },
      oneOf: {
         enumerable: true,
         value: oneOf
      },
      arrayOf: {
         enumerable: true,
         value: arrayOf
      }
   });

   return <Chained>wrapper;
}

/**
 * Creates type descriptor for given value type.
 * @name Types/Type/descriptor#chain
 * @param {Descriptor} type Value type.
 * @returns {Chained} Type descriptor.
 */
export default function descriptor(type: Descriptor): Chained {
   return chain(
      validate(type)
   );
}