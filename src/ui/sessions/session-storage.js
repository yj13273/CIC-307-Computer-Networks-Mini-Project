/**
 * IndexedDB Persistent Session Storage
 * Complies with Frontend Contract FE-001 Section 4
 */

const DB_NAME = 'NetArchitectDB';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';
const FALLBACK_KEY = 'netarchitect_sessions_backup';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('scenarioId', 'scenarioId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Fallback to localStorage if IndexedDB fails or is unavailable
 */
function getFallbackSessions() {
  try {
    const raw = localStorage.getItem(FALLBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveFallbackSessions(sessions) {
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.warn('LocalStorage backup failed:', e);
  }
}

export async function saveSession(session) {
  if (!session.id) {
    session.id = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }
  session.updatedAt = new Date().toISOString();
  if (!session.createdAt) {
    session.createdAt = session.updatedAt;
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(session);
      req.onsuccess = () => resolve(session);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB write failed, using localStorage fallback', err);
    const sessions = getFallbackSessions();
    const idx = sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) sessions[idx] = session;
    else sessions.push(session);
    saveFallbackSessions(sessions);
    return session;
  }
}

export async function getAllSessions() {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const sorted = (req.result || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        resolve(sorted);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB read failed, using localStorage fallback', err);
    return getFallbackSessions().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

export async function getSessionById(id) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    const sessions = getFallbackSessions();
    return sessions.find(s => s.id === id) || null;
  }
}

export async function deleteSession(id) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    let sessions = getFallbackSessions();
    sessions = sessions.filter(s => s.id !== id);
    saveFallbackSessions(sessions);
    return true;
  }
}

export async function renameSession(id, newName) {
  const session = await getSessionById(id);
  if (!session) throw new Error(`Session with id ${id} not found`);
  session.name = newName;
  return saveSession(session);
}

export async function duplicateSession(id) {
  const session = await getSessionById(id);
  if (!session) throw new Error(`Session with id ${id} not found`);
  const cloned = JSON.parse(JSON.stringify(session));
  cloned.id = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  cloned.name = `${session.name} (Copy)`;
  cloned.createdAt = new Date().toISOString();
  cloned.updatedAt = cloned.createdAt;
  return saveSession(cloned);
}

