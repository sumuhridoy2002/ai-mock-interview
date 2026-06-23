export interface ContextDataMetrics {
  localStorageBytes: number;
  sessionStorageBytes: number;
  apiResponseBytes: number | null;
  jsHeapUsedBytes: number | null;
  jsHeapLimitBytes: number | null;
  storageItemCount: number;
  totalClientContextBytes: number;
}

export const EMPTY_CONTEXT_DATA: ContextDataMetrics = {
  localStorageBytes: 0,
  sessionStorageBytes: 0,
  apiResponseBytes: null,
  jsHeapUsedBytes: null,
  jsHeapLimitBytes: null,
  storageItemCount: 0,
  totalClientContextBytes: 0,
};

function storageBytes(storage: Storage): { bytes: number; items: number } {
  let bytes = 0;
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (!key) continue;
    const value = storage.getItem(key) ?? "";
    bytes += new Blob([key, value]).size;
  }

  return { bytes, items: storage.length };
}

function measureJsHeap(): Pick<ContextDataMetrics, "jsHeapUsedBytes" | "jsHeapLimitBytes"> {
  if (typeof window === "undefined") {
    return { jsHeapUsedBytes: null, jsHeapLimitBytes: null };
  }

  const memory = (performance as Performance & {
    memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
  }).memory;

  if (!memory) {
    return { jsHeapUsedBytes: null, jsHeapLimitBytes: null };
  }

  return {
    jsHeapUsedBytes: memory.usedJSHeapSize,
    jsHeapLimitBytes: memory.jsHeapSizeLimit,
  };
}

export function measureClientContext(apiResponseBytes: number | null = null): ContextDataMetrics {
  if (typeof window === "undefined") {
    return { ...EMPTY_CONTEXT_DATA, apiResponseBytes };
  }

  const local = storageBytes(window.localStorage);
  const session = storageBytes(window.sessionStorage);
  const heap = measureJsHeap();

  const totalClientContextBytes =
    local.bytes +
    session.bytes +
    (apiResponseBytes ?? 0) +
    (heap.jsHeapUsedBytes ?? 0);

  return {
    localStorageBytes: local.bytes,
    sessionStorageBytes: session.bytes,
    apiResponseBytes,
    jsHeapUsedBytes: heap.jsHeapUsedBytes,
    jsHeapLimitBytes: heap.jsHeapLimitBytes,
    storageItemCount: local.items + session.items,
    totalClientContextBytes,
  };
}
