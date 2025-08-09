import assert from 'assert';

import {
  without
} from '../src/utils';

describe('utils', () => {
  describe('without', () => {
    describe('array with no duplicates', () => {
      it('returns an array excluding specified values', () => {
        assert.deepEqual(without([1, 2, 3], 2), [1, 3]);
      });
    });

    describe('array with duplicates', () => {
      it('returns an array excluding specified values', () => {
        assert.deepEqual(without([2, 1, 2, 3], 1, 2), [3]);
      });
    });
  });
});
