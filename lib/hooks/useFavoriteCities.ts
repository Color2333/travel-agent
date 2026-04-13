import { useEffect, useState } from 'react';

export interface FavoriteCity {
  id: string;
  name: string;
  lat: number;
  lng: number;
  qweatherId?: string;
  province?: string;
  addedAt: number;
}

const STORAGE_KEY = 'travel-agent-favorites';

export function useFavoriteCities() {
  const [favorites, setFavorites] = useState<FavoriteCity[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load favorite cities:', error);
    }
    setIsLoaded(true);
  }, []);

  const addFavorite = (city: Omit<FavoriteCity, 'id' | 'addedAt'>) => {
    setFavorites((prev) => {
      // 检查是否已存在
      if (prev.some((c) => c.name === city.name)) {
        return prev;
      }

      const newFavorite: FavoriteCity = {
        ...city,
        id: `${city.name}-${Date.now()}`,
        addedAt: Date.now(),
      };

      const updated = [...prev, newFavorite];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const removeFavorite = (cityName: string) => {
    setFavorites((prev) => {
      const updated = prev.filter((c) => c.name !== cityName);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const isFavorite = (cityName: string) => {
    return favorites.some((c) => c.name === cityName);
  };

  const clearFavorites = () => {
    setFavorites([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    favorites,
    isLoaded,
    addFavorite,
    removeFavorite,
    isFavorite,
    clearFavorites,
  };
}
