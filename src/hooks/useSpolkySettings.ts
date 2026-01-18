import { useState, useEffect } from 'react';
import { StorageService } from '../services/storage/StorageService';

const STORAGE_KEY = 'reis_opted_in_associations';

export function useSpolkySettings() {
  // Initialize state synchronously from storage to avoid flash of incorrect content
  const [optedInAssociations, setOptedInAssociations] = useState<string[]>(() => {
    return StorageService.get<string[]>(STORAGE_KEY) || [];
  });
  const [isLoading, setIsLoading] = useState(false);

  // Listen for changes from other components/hooks
  useEffect(() => {
    const loadSettings = () => {
      const saved = StorageService.get<string[]>(STORAGE_KEY) || [];
      setOptedInAssociations(saved);
    };

    const handleStorageChange = () => loadSettings();
    window.addEventListener('reis-spolky-settings-changed', handleStorageChange);
    
    return () => {
      window.removeEventListener('reis-spolky-settings-changed', handleStorageChange);
    };
  }, []);

  const toggleAssociation = (associationId: string) => {
    setOptedInAssociations(current => {
      const newSettings = current.includes(associationId)
        ? current.filter(id => id !== associationId)
        : [...current, associationId];
      
      StorageService.set(STORAGE_KEY, newSettings);
      
      // Dispatch event to notify other components (e.g. NotificationFeed)
      window.dispatchEvent(new Event('reis-spolky-settings-changed'));
      
      return newSettings;
    });
  };

  const isOptedIn = (associationId: string) => {
    return optedInAssociations.includes(associationId);
  };

  return {
    optedInAssociations,
    toggleAssociation,
    isOptedIn,
    isLoading
  };
}
