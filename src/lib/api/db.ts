import type { Database } from '@/types';

let cachedDb: Database | null = null;

/**
 * Charge la base de données depuis le fichier JSON public
 */
export async function loadDatabase(): Promise<Database> {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    const response = await fetch('/db.json');
    if (!response.ok) {
      throw new Error('Failed to load database');
    }
    const data = await response.json();
    cachedDb = data;
    return data;
  } catch (error) {
    console.error('Error loading database:', error);
    throw error;
  }
}

/**
 * Recharge la base de données (utile après des modifications)
 */
export async function reloadDatabase(): Promise<Database> {
  cachedDb = null;
  return loadDatabase();
}

/**
 * Récupère la base de données en cache (synchrone)
 */
export function getCachedDatabase(): Database | null {
  return cachedDb;
}
