'use client';

import { useState, useEffect } from 'react';

/**
 * Hook pour sauvegarder et récupérer des données dans localStorage
 * Auto-save à chaque changement
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger depuis localStorage au montage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        }
        setIsLoaded(true);
      }
    } catch (error) {
      console.error('Erreur lecture localStorage:', error);
      setIsLoaded(true);
    }
  }, [key]);

  // Fonction pour mettre à jour la valeur
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error('Erreur sauvegarde localStorage:', error);
    }
  };

  // Fonction pour effacer la valeur
  const clearValue = () => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
      setStoredValue(initialValue);
    } catch (error) {
      console.error('Erreur suppression localStorage:', error);
    }
  };

  return [storedValue, setValue, clearValue, isLoaded] as const;
}
