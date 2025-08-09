/**
 * @param {Object} obj
 * @return {Object}
 */
export const clone = <T>(obj: T): T => Object.assign({}, obj);

/**
 * Simplified version of https://lodash.com/docs/4.17.4#difference
 * @param {Array.<any>} arr
 * @param {Array.<any>} values
 * @return {Array.<any>}
 */
export const difference = <T>(arr: T[], values: T[]): T[] =>
  arr.filter((value) => !~values.indexOf(value));

/**
 * Simplified version of https://lodash.com/docs/4.17.4#forEach, but only for
 * Objects.
 * @param {Object.<any>} obj
 * @param {Function(any)} fn
 */
export const each = <T>(
  obj: { [key: string]: T },
  fn: (value: T, key: string) => void
) => Object.keys(obj).forEach((key) => fn(obj[key], key));

/*!
 * Simplified version of https://lodash.com/docs/4.17.4#intersection
 * @param {Array.<any>} arr1
 * @param {Array.<any>} arr2
 * @return {Array.<any>}
 */
export const intersection = <T>(arr1: T[], arr2: T[]): T[] =>
  arr1.filter((el) => ~arr2.indexOf(el));

/**
 * Simplified version of https://lodash.com/docs/4.17.4#pick
 * @param {Object.<any>} obj
 * @param {Array.<string>} keyNames
 */
export const pick = <
  T extends { [key: string]: unknown },
  K extends keyof T
>(
  obj: T,
  keyNames: K[]
): Pick<T, K> =>
  keyNames.reduce((acc, keyName) => {
    const val = obj[keyName];

    if (typeof val !== 'undefined') {
      acc[keyName] = val;
    }

    return acc;
  }, {} as Pick<T, K>);

/**
 * Simplified version of https://lodash.com/docs/4.17.4#reject
 * @param {Array.<any>} arr
 * @param {Function(any)} fn
 * @return {Array.<any>}
 */
export const reject = <T>(arr: T[], fn: (value: T) => boolean): T[] =>
  arr.filter((el) => !fn(el));

/**
 * Simplified version of https://lodash.com/docs/4.17.4#uniq
 * @param {Array.<any>} arr
 * @return {Array.<any>}
 */
export const uniq = <T>(arr: T[]): T[] =>
  arr.reduce((acc, value) => {
    if (!~acc.indexOf(value)) {
      acc.push(value);
    }

    return acc;
  }, [] as T[]);

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
export const without = <T>(array: T[], ...values: T[]): T[] =>
  array.filter((value) => !~values.indexOf(value));
