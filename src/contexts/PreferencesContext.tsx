import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface PreferencesContextType {
  favoriteTools: string[];
  toggleFavorite: (toolId: string) => void;
  isFavorite: (toolId: string) => boolean;
  reorderFavorites: (newOrder: string[]) => void;
  syncPreferences: () => Promise<void>;
}

const DEFAULT_FAVORITES = ['pdf-to-word', 'pdf-to-excel', 'jpg-to-pdf', 'compress-pdf'];

const PreferencesContext = createContext<PreferencesContextType>({
  favoriteTools: DEFAULT_FAVORITES,
  toggleFavorite: () => {},
  isFavorite: () => false,
  reorderFavorites: () => {},
  syncPreferences: async () => {}
});

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [favoriteTools, setFavoriteTools] = useState<string[]>(() => {
    const saved = localStorage.getItem('convertinghub_favorite_tools');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return DEFAULT_FAVORITES;
  });

  // Sync preferences from Firestore when user changes
  useEffect(() => {
    if (!user) return;
    const fetchUserPreferences = async () => {
      try {
        const prefRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(prefRef);
        if (docSnap.exists() && docSnap.data().preferences?.favoriteTools) {
          const remoteFavorites = docSnap.data().preferences.favoriteTools;
          if (Array.isArray(remoteFavorites)) {
            setFavoriteTools(remoteFavorites);
            localStorage.setItem('convertinghub_favorite_tools', JSON.stringify(remoteFavorites));
          }
        }
      } catch (e) {
        console.warn('[Preferences] Sync read notice:', e);
      }
    };

    fetchUserPreferences();
  }, [user]);

  const savePreferences = async (newFavorites: string[]) => {
    setFavoriteTools(newFavorites);
    localStorage.setItem('convertinghub_favorite_tools', JSON.stringify(newFavorites));

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(
          userRef,
          {
            preferences: {
              favoriteTools: newFavorites,
              updatedAt: Date.now()
            }
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('[Preferences] Sync write notice:', e);
      }
    }
  };

  const toggleFavorite = (toolId: string) => {
    const cleanId = toolId.replace(/^\//, '');
    const isFav = favoriteTools.includes(cleanId);
    let updated: string[];

    if (isFav) {
      updated = favoriteTools.filter((id) => id !== cleanId);
    } else {
      updated = [...favoriteTools, cleanId];
    }

    savePreferences(updated);
  };

  const isFavorite = (toolId: string) => {
    const cleanId = toolId.replace(/^\//, '');
    return favoriteTools.includes(cleanId);
  };

  const reorderFavorites = (newOrder: string[]) => {
    const cleaned = newOrder.map((id) => id.replace(/^\//, ''));
    savePreferences(cleaned);
  };

  const syncPreferences = async () => {
    await savePreferences(favoriteTools);
  };

  return (
    <PreferencesContext.Provider
      value={{
        favoriteTools,
        toggleFavorite,
        isFavorite,
        reorderFavorites,
        syncPreferences
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => useContext(PreferencesContext);
