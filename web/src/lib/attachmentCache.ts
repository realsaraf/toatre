/**
 * Client-side attachment cache backed by IndexedDB.
 * Stores raw bytes so files survive page navigations and work offline.
 *
 * Browser-only — never import in server components or API routes.
 */

const DB_NAME = "toatre-cache";
const STORE = "attachments";
const DB_VERSION = 1;
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  attachmentId: string;
  toatId: string;
  mimeType: string;
  bytes: ArrayBuffer;
  cachedAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "attachmentId" });
        store.createIndex("toatId", "toatId", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Returns a cached blob URL, or null if not cached / expired. */
export async function getCachedBlob(attachmentId: string): Promise<string | null> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(attachmentId);
      req.onsuccess = () => {
        const entry = req.result as CacheEntry | undefined;
        if (!entry) return resolve(null);
        if (Date.now() - entry.cachedAt > TTL_MS) return resolve(null);
        resolve(URL.createObjectURL(new Blob([entry.bytes], { type: entry.mimeType })));
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/** Caches raw bytes for an attachment. */
export async function setCachedBlob(
  attachmentId: string,
  toatId: string,
  mimeType: string,
  bytes: ArrayBuffer
): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const entry: CacheEntry = { attachmentId, toatId, mimeType, bytes, cachedAt: Date.now() };
      const tx = db.transaction(STORE, "readwrite");
      const req = tx.objectStore(STORE).put(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Non-fatal — continue without caching
  }
}

/** Removes a single cached entry (call on attachment delete). */
export async function deleteCachedBlob(attachmentId: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(attachmentId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve(); // non-fatal
    });
  } catch {
    // Non-fatal
  }
}

/** Removes all cached attachments for a toat (call on toat delete). */
export async function deleteToatCache(toatId: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      const index = tx.objectStore(STORE).index("toatId");
      const req = index.openCursor(IDBKeyRange.only(toatId));
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) return;
        cursor.delete();
        cursor.continue();
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve(); // non-fatal
    });
  } catch {
    // Non-fatal
  }
}
