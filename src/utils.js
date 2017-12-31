/**
 * @param {Object} obj
 * @return {Object}
 */
export const clone = obj => Object.assign({}, obj);

/**
 * Simplified version of https://lodash.com/docs/4.17.4#difference
 * @param {Array.<any>} arr
 * @param {Array.<any>} values
 * @return {Array.<any>}
 */
export const difference = (arr, values) =>
  arr.filter(value => !~values.indexOf(value));

/**
 * Simplified version of https://lodash.com/docs/4.17.4#forEach, but only for
 * Objects.
 * @param {Object.<any>} obj
 * @param {Function(any)} fn
 */
export const each = (obj, fn) =>
  Object.keys(obj).forEach(key => fn(obj[key], key));

/*!
 * Simplified version of https://lodash.com/docs/4.17.4#intersection
 * @param {Array.<any>} arr1
 * @param {Array.<any>} arr2
 * @return {Array.<any>}
 */
export const intersection =
  (arr1, arr2) => arr1.filter(el => ~arr2.indexOf(el));

/**
 * Simplified version of https://lodash.com/docs/4.17.4#pick
 * @param {Object.<any>} obj
 * @param {Array.<string>} keyNames
 */
export const pick = (obj, keyNames) =>
  keyNames.reduce(
    (acc, keyName) => {
      const val = obj[keyName];

      if (typeof val !== 'undefined') {
        acc[keyName] = val;
      }

      return acc;
    },
    {}
  );

/**
 * Simplified version of https://lodash.com/docs/4.17.4#reject
 * @param {Array.<any>} arr
 * @param {Function(any)} fn
 * @return {Array.<any>}
 */
export const reject = (arr, fn) => arr.filter(el => !fn(el));

/**
 * Simplified version of https://lodash.com/docs/4.17.4#uniq
 * @param {Array.<any>} arr
 * @return {Array.<any>}
 */
export const uniq = arr =>
  arr.reduce((acc, value) => {
    if (!~acc.indexOf(value)) {
      acc.push(value);
    }

    return acc;
  }, []);

let incrementer = 0;
/**
 * @param {string} [prefix]
 * @return {string}
 */
export const uniqueId = (prefix = '') => prefix + incrementer++;

/**
 * Simplified version of https://lodash.com/docs/4.17.4#without
 * @param {Array.<any>} array
 * @param {...any} values
 * @return {Array.<any>}
 */
export const without = (array, ...values) =>
  array.filter(value => !~values.indexOf(value));
