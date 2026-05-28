import { v4 as uuidv4 } from 'uuid';
import type { KangekiRecord } from '@/types';

const KEYS = {
  records: 'kangeki_records',
  userTags: 'kangeki_user_tags',
  tmdbApiKey: 'kangeki_tmdb_apikey',
} as const;

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Records
export function getRecords(): KangekiRecord[] {
  return load<KangekiRecord[]>(KEYS.records, []);
}

export function saveRecord(record: Omit<KangekiRecord, 'id' | 'createdAt' | 'updatedAt'>): KangekiRecord {
  const records = getRecords();
  const now = new Date().toISOString();
  const newRecord: KangekiRecord = { ...record, id: uuidv4(), createdAt: now, updatedAt: now };
  save(KEYS.records, [newRecord, ...records]);
  return newRecord;
}

export function updateRecord(id: string, data: Partial<Omit<KangekiRecord, 'id' | 'createdAt'>>): KangekiRecord | null {
  const records = getRecords();
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const updated: KangekiRecord = { ...records[idx], ...data, updatedAt: new Date().toISOString() };
  records[idx] = updated;
  save(KEYS.records, records);
  return updated;
}

export function deleteRecord(id: string): void {
  const records = getRecords().filter((r) => r.id !== id);
  save(KEYS.records, records);
}

export function getRecordById(id: string): KangekiRecord | null {
  return getRecords().find((r) => r.id === id) ?? null;
}

// User tags
export function getUserTags(): string[] {
  return load<string[]>(KEYS.userTags, []);
}

export function saveUserTag(tag: string): void {
  const tags = getUserTags();
  if (!tags.includes(tag)) {
    save(KEYS.userTags, [...tags, tag]);
  }
}

// TMDB API key
export function getTmdbApiKey(): string {
  return load<string>(KEYS.tmdbApiKey, '');
}

export function saveTmdbApiKey(key: string): void {
  save(KEYS.tmdbApiKey, key);
}

export function clearTmdbApiKey(): void {
  if (typeof window !== 'undefined') localStorage.removeItem(KEYS.tmdbApiKey);
}

// --- useSyncExternalStore support for records ---
let _recordsJson: string | null = null;
let _recordsCache: KangekiRecord[] = [];

export function getRecordsSnapshot(): KangekiRecord[] {
  if (typeof window === 'undefined') return [];
  const json = localStorage.getItem(KEYS.records) ?? '[]';
  if (json !== _recordsJson) {
    _recordsJson = json;
    try { _recordsCache = JSON.parse(json); } catch { _recordsCache = []; }
  }
  return _recordsCache;
}

export function subscribeRecords(onStoreChange: () => void): () => void {
  window.addEventListener('storage', onStoreChange);
  return () => window.removeEventListener('storage', onStoreChange);
}
