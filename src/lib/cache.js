const cache = new Map();
const TTL_MAP = {
  brands: 300000,
  models: 300000,
  provinces: 600000,
  cities: 600000,
  siteSettings: 120000,
  featuredCars: 60000,
  carById: 60000,
  plans: 600000,
  badges: 600000,
  maintenanceServices: 300000,
  forumCategories: 300000,
  default: 30000,
};

function get(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function set(key, value, ttlMs) {
  const ttl = ttlMs || TTL_MAP[key.split(':')[0]] || TTL_MAP.default;
  cache.set(key, { value, expiresAt: Date.now() + ttl });
}

function del(key) {
  cache.delete(key);
}

function delPattern(prefix) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

function clear() {
  cache.clear();
}

function stats() {
  let hits = 0, misses = 0, expired = 0;
  for (const [key, entry] of cache) {
    if (Date.now() > entry.expiresAt) expired++;
  }
  return { size: cache.size, expired };
}

module.exports = { get, set, del, delPattern, clear, stats };
