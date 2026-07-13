// Run an async mapper over items with bounded concurrency.
// Keeps memory/rate pressure in check when generating many emails at once.
export async function pMap(items, mapper, concurrency = 4) {
  const results = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const cur = index++;
      results[cur] = await mapper(items[cur], cur);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, worker);
  await Promise.all(workers);
  return results;
}
