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
  blob: Blob;
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

// Documents IDB operations
export async function saveDocumentToIDB(doc: StoredDocument): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(doc);
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

// Recursive Metadata Scanner & Reconciler for Authorized SAF Folders
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

      // Recursive scan function
      const traverseDirectory = async (dirHandle: any, currentPath: string) => {
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'file') {
            try {
              const file = await entry.getFile();
              const type = detectFileType(file.name);
              if (type !== 'other') {
                const id = `${folderRecord.id}:${currentPath}/${file.name}`;
                scannedDocIds.add(id);

                const sizeStr = formatSizeBytes(file.size);
                const dateStr = new Date(file.lastModified).toLocaleDateString();

                const docRecord: StoredDocument = {
                  id,
                  name: file.name,
                  size: sizeStr,
                  sizeBytes: file.size,
                  type,
                  date: dateStr,
                  lastModified: file.lastModified,
                  folderId: folderRecord.id,
                  relativePath: `${currentPath}/${file.name}`,
                  blob: file
                };

                docMap.set(id, docRecord);
                await saveDocumentToIDB(docRecord);
              }
            } catch (err) {
              console.warn('[FileStore] Failed reading file handle:', err);
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
