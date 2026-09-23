// IndexedDB Storage Utility for persisting documents and persistent authorized SAF folder handles
const DB_NAME = 'ConvertingHubFilesDB';
const STORE_NAME = 'user_documents';
const FOLDERS_STORE = 'authorized_folders';
const DB_VERSION = 2;

export interface AuthorizedFolderRecord {
  id: string;
  name: string;
  addedAt: number;
  handle?: any; // FileSystemDirectoryHandle on Web / PWA
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(FOLDERS_STORE)) {
        db.createObjectStore(FOLDERS_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

export type SupportedFileType =
  | 'pdf'
  | 'docx'
  | 'xlsx'
  | 'pptx'
  | 'txt'
  | 'image'
  | 'archive'
  | 'other';

export interface StoredDocument {
  id: string;
  name: string;
  size: string;
  sizeBytes?: number;
  type: SupportedFileType;
  extension?: string;
  date: string;
  lastModified?: number;
  folderId?: string;
  relativePath?: string;
  uri?: string;
  blob?: Blob;
  handle?: any;
  thumbnailUrl?: string;
}

export function detectFileType(filename: string): SupportedFileType {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'pdf';
  if (['docx', 'doc'].includes(ext)) return 'docx';
  if (['xlsx', 'xls', 'csv'].includes(ext)) return 'xlsx';
  if (['pptx', 'ppt'].includes(ext)) return 'pptx';
  if (['txt', 'log', 'md', 'json'].includes(ext)) return 'txt';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(ext)) return 'image';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
  return 'other';
}

export function formatSizeBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// On-demand document file loader
export async function loadFileFromStoredDocument(doc: StoredDocument): Promise<File | Blob | null> {
  if (doc.blob) return doc.blob;
  if (doc.handle && typeof doc.handle.getFile === 'function') {
    try {
      return await doc.handle.getFile();
    } catch (e) {
      console.warn('[FileStore] Failed reading handle:', e);
    }
  }
  if (doc.uri) {
    try {
      const res = await fetch(doc.uri);
      return await res.blob();
    } catch (e) {
      console.warn('[FileStore] Failed fetching content URI:', e);
    }
  }
  return null;
}

// Documents IDB operations (Metadata indexing only)
export async function saveDocumentToIDB(doc: StoredDocument): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Ensure we do NOT serialize heavy binary blobs into metadata IndexedDB records
    const metadataOnly: StoredDocument = {
      id: doc.id,
      name: doc.name,
      size: doc.size,
      sizeBytes: doc.sizeBytes,
      type: doc.type,
      extension: doc.extension,
      date: doc.date,
      lastModified: doc.lastModified,
      folderId: doc.folderId,
      relativePath: doc.relativePath,
      uri: doc.uri,
      thumbnailUrl: doc.thumbnailUrl
      // handle is kept in-memory or persisted via SAF directory handle
    };

    const req = store.put(metadataOnly);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllDocumentsFromIDB(): Promise<StoredDocument[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('[FileStore] Failed to fetch documents from IndexedDB:', e);
    return [];
  }
}

export async function deleteDocumentFromIDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllDocumentsFromIDB(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Persistent SAF Authorized Folders Operations
export async function saveAuthorizedFolderToIDB(folder: AuthorizedFolderRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FOLDERS_STORE, 'readwrite');
    const store = tx.objectStore(FOLDERS_STORE);
    const req = store.put(folder);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAuthorizedFoldersFromIDB(): Promise<AuthorizedFolderRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(FOLDERS_STORE, 'readonly');
      const store = tx.objectStore(FOLDERS_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('[FileStore] Failed to fetch authorized folders:', e);
    return [];
  }
}

export async function removeAuthorizedFolderFromIDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FOLDERS_STORE, 'readwrite');
    const store = tx.objectStore(FOLDERS_STORE);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Recursive Metadata Scanner & Reconciler for Authorized SAF Folders (Metadata Only)
export async function scanAndReconcileAuthorizedFolders(
  folders: AuthorizedFolderRecord[]
): Promise<StoredDocument[]> {
  const currentDocs = await getAllDocumentsFromIDB();
  const docMap = new Map<string, StoredDocument>();
  currentDocs.forEach((doc) => docMap.set(doc.id, doc));

  const scannedDocIds = new Set<string>();

  for (const folderRecord of folders) {
    if (!folderRecord.handle) continue;
    try {
      // Verify permission if supported
      if (typeof folderRecord.handle.queryPermission === 'function') {
        const status = await folderRecord.handle.queryPermission({ mode: 'read' });
        if (status !== 'granted') {
          const reqStatus = await folderRecord.handle.requestPermission({ mode: 'read' });
          if (reqStatus !== 'granted') continue;
        }
      }

      // Fast Metadata-only scan (No reading full file contents into memory)
      const traverseDirectory = async (dirHandle: any, currentPath: string) => {
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'file') {
            try {
              const type = detectFileType(entry.name);
              if (type !== 'other') {
                const id = `${folderRecord.id}:${currentPath}/${entry.name}`;
                scannedDocIds.add(id);

                let sizeBytes = 0;
                let lastModified = Date.now();
                
                // Read metadata header only
                if (typeof entry.getFile === 'function') {
                  const meta = await entry.getFile();
                  sizeBytes = meta.size;
                  lastModified = meta.lastModified;
                }

                const docRecord: StoredDocument = {
                  id,
                  name: entry.name,
                  size: formatSizeBytes(sizeBytes),
                  sizeBytes,
                  type,
                  date: new Date(lastModified).toLocaleDateString(),
                  lastModified,
                  folderId: folderRecord.id,
                  relativePath: `${currentPath}/${entry.name}`,
                  handle: entry
                };

                docMap.set(id, docRecord);
                await saveDocumentToIDB(docRecord);
              }
            } catch (err) {
              console.warn('[FileStore] Failed reading entry metadata:', err);
            }
          } else if (entry.kind === 'directory') {
            await traverseDirectory(entry, `${currentPath}/${entry.name}`);
          }
        }
      };

      await traverseDirectory(folderRecord.handle, folderRecord.name);
    } catch (err) {
      console.warn('[FileStore] Failed scanning folder:', folderRecord.name, err);
    }
  }

  // Remove deleted files that belonged to scanned folders
  for (const doc of currentDocs) {
    if (doc.folderId && !scannedDocIds.has(doc.id)) {
      await deleteDocumentFromIDB(doc.id);
      docMap.delete(doc.id);
    }
  }

  return Array.from(docMap.values());
}
