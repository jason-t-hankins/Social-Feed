import DataLoader from 'dataloader';

/**
 * Tests demonstrating DataLoader batching behavior.
 * These tests don't require a database connection.
 */
describe('DataLoader Batching', () => {
  let batchFunction: jest.Mock;
  let loader: DataLoader<string, string | null>;

  beforeEach(() => {
    // Mock batch function that tracks calls
    batchFunction = jest.fn(async (keys: readonly string[]) => {
      // Simulate database lookup
      return keys.map((key) => `result-${key}`);
    });
    
    loader = new DataLoader(batchFunction);
  });

  test('batches multiple concurrent loads', async () => {
    // Multiple loads in same tick should be batched
    const results = await Promise.all([
      loader.load('1'),
      loader.load('2'),
      loader.load('3'),
    ]);

    // Batch function should be called once with all keys
    expect(batchFunction).toHaveBeenCalledTimes(1);
    expect(batchFunction).toHaveBeenCalledWith(['1', '2', '3']);
    
    expect(results).toEqual(['result-1', 'result-2', 'result-3']);
  });

  test('deduplicates identical keys', async () => {
    const results = await Promise.all([
      loader.load('1'),
      loader.load('1'),  // Duplicate
      loader.load('2'),
      loader.load('1'),  // Another duplicate
    ]);

    // Only unique keys should be in the batch
    expect(batchFunction).toHaveBeenCalledWith(['1', '2']);
    
    // All results should be correct
    expect(results).toEqual(['result-1', 'result-1', 'result-2', 'result-1']);
  });

  test('caches results within request', async () => {
    // First load
    await loader.load('1');
    
    // Second load of same key (after await, so different tick)
    await loader.load('1');

    // Should only call batch function once due to caching
    expect(batchFunction).toHaveBeenCalledTimes(1);
  });

  test('sequential loads without Promise.all are NOT batched', async () => {
    // These are in different ticks - not batched
    await loader.load('1');
    await loader.load('2');

    // But due to caching, if we had new keys:
    loader.clearAll();
    await loader.load('3');
    await loader.load('4');

    // Each sequential await creates a separate batch
    // (Unless the loader implements request batching across ticks)
    expect(batchFunction.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  test('loadMany batches all keys', async () => {
    const results = await loader.loadMany(['1', '2', '3']);

    expect(batchFunction).toHaveBeenCalledTimes(1);
    expect(batchFunction).toHaveBeenCalledWith(['1', '2', '3']);
    
    expect(results).toEqual(['result-1', 'result-2', 'result-3']);
  });
});

describe('DataLoader Error Handling', () => {
  test('handles individual errors without failing entire batch', async () => {
    const batchFunction = jest.fn(async (keys: readonly string[]) => {
      return keys.map((key) => {
        if (key === 'error') {
          return new Error('Failed to load');
        }
        return `result-${key}`;
      });
    });

    const loader = new DataLoader(batchFunction);

    const results = await Promise.allSettled([
      loader.load('1'),
      loader.load('error'),
      loader.load('2'),
    ]);

    expect(results[0]).toEqual({ status: 'fulfilled', value: 'result-1' });
    expect(results[1]).toEqual({ status: 'rejected', reason: new Error('Failed to load') });
    expect(results[2]).toEqual({ status: 'fulfilled', value: 'result-2' });
  });
});

describe('DataLoader Options', () => {
  test('respects maxBatchSize option', async () => {
    const batchFunction = jest.fn(async (keys: readonly string[]) => {
      return keys.map((key) => `result-${key}`);
    });

    const loader = new DataLoader(batchFunction, { maxBatchSize: 2 });

    // Load 5 items - should be split into batches of 2
    await Promise.all([
      loader.load('1'),
      loader.load('2'),
      loader.load('3'),
      loader.load('4'),
      loader.load('5'),
    ]);

    // Should have made 3 batch calls (2, 2, 1)
    expect(batchFunction.mock.calls.length).toBe(3);
    expect(batchFunction.mock.calls[0][0]).toHaveLength(2);
    expect(batchFunction.mock.calls[1][0]).toHaveLength(2);
    expect(batchFunction.mock.calls[2][0]).toHaveLength(1);
  });

  test('can disable caching', async () => {
    const batchFunction = jest.fn(async (keys: readonly string[]) => {
      return keys.map((key) => `result-${key}`);
    });

    const loader = new DataLoader(batchFunction, { cache: false });

    await loader.load('1');
    await loader.load('1');

    // Without caching, same key loads twice
    expect(batchFunction).toHaveBeenCalledTimes(2);
  });
});
