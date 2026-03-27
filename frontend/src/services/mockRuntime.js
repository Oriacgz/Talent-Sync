const mockModules = import.meta.glob('../mock/*.js');

const cache = new Map();

export async function getMockExport(fileName, exportName) {
  const key = `../mock/${fileName}`;
  const loader = mockModules[key];

  if (!loader) {
    return undefined;
  }

  if (!cache.has(key)) {
    cache.set(key, loader().catch(() => null));
  }

  const mod = await cache.get(key);
  if (!mod || !(exportName in mod)) {
    return undefined;
  }
  return mod[exportName];
}

export async function resolveData({ apiCall, mockFile, mockExport, fallbackValue }) {
  try {
    const result = await apiCall();
    if (result !== undefined && result !== null) {
      return result;
    }
  } catch {
    // We intentionally fall back to mock/empty values for resilient UI.
  }

  const mockValue = await getMockExport(mockFile, mockExport);
  if (mockValue !== undefined) {
    return mockValue;
  }
  return fallbackValue;
}
