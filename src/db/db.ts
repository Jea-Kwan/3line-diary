import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import { DiaryEntry } from '../types';

interface DiaryDB extends DBSchema {
  entries: {
    key: string; // date (YYYY-MM-DD)
    value: DiaryEntry;
    indexes: { 'by-date': string };
  };
}

const DB_NAME = 'three-line-diary';
const STORE_NAME = 'entries';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<DiaryDB>> | null = null;

function getDB(): Promise<IDBPDatabase<DiaryDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DiaryDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'date' });
        store.createIndex('by-date', 'date');
      },
    });
  }
  return dbPromise;
}

export async function getEntryByDate(date: string): Promise<DiaryEntry | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, date);
}

export async function listEntries(): Promise<DiaryEntry[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex(STORE_NAME, 'by-date');
  return all.sort((a, b) => b.date.localeCompare(a.date));
}

export async function saveEntry(
  date: string,
  lines: [string, string, string],
  photo: Blob | null
): Promise<DiaryEntry> {
  const db = await getDB();
  const existing = await db.get(STORE_NAME, date);
  const now = Date.now();
  const entry: DiaryEntry = {
    id: existing?.id ?? uuidv4(),
    date,
    photo: photo ?? existing?.photo ?? null,
    lines,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await db.put(STORE_NAME, entry);
  return entry;
}

export async function deleteEntry(date: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, date);
}
