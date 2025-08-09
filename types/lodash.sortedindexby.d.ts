declare module 'lodash.sortedindexby' {
  function sortedIndexBy<T>(
    array: T[] | null | undefined,
    value: T,
    iteratee: (value: T) => unknown
  ): number;
  export = sortedIndexBy;
}
