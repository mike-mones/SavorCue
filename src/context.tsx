import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { SessionEngine } from './engine';
import type { ActiveSession, AppSettings } from './types';
import { loadSettings, saveSettings } from './db';
import { DEFAULT_SETTINGS } from './defaults';
import { useAuth } from './authContext';
import { syncSettingsToCloud, getSettingsFromCloud } from './cloud';
import { requestNotificationPermission } from './notifications';

interface AppContextValue {
  engine: SessionEngine;
  active: ActiveSession | null;
  settings: AppSettings;
  updateSettings: (s: AppSettings) => Promise<void>;
  ready: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [active, setActive] = useState<ActiveSession | null>(null);
  const [ready, setReady] = useState(false);
  const engineRef = useRef<SessionEngine>(new SessionEngine(DEFAULT_SETTINGS));

  // Initialize
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Load local settings first
        let loaded = await loadSettings();

        // If signed in, try to load from cloud and merge
        if (user) {
          try {
            const cloudSettings = await getSettingsFromCloud(user.uid);
            if (cloudSettings) loaded = cloudSettings;
          } catch {
            // Cloud unavailable, use local
          }
          engineRef.current.setUid(user.uid);
        } else {
          engineRef.current.setUid(null);
        }

        if (!mounted) return;
        setSettings(loaded);
        engineRef.current.updateSettings(loaded);
        await engineRef.current.restore();
        setActive(engineRef.current.getActive());

        // Request notification permission
        requestNotificationPermission();
      } catch {
        // Ensure app loads even if init fails
      }
      if (mounted) setReady(true);
    })();
    return () => { mounted = false; };
  }, [user]);

  // Subscribe to engine changes
  useEffect(() => {
    const unsub = engineRef.current.subscribe(() => {
      setActive(engineRef.current.getActive());
    });
    return unsub;
  }, []);

  // Tick timer
  useEffect(() => {
    const id = setInterval(() => {
      engineRef.current.tick();
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const updateSettingsHandler = useCallback(async (s: AppSettings) => {
    await saveSettings(s);
    if (user) {
      syncSettingsToCloud(user.uid, s).catch(() => {});
    }
    setSettings(s);
    engineRef.current.updateSettings(s);
  }, [user]);

  return (
    <AppContext.Provider
      value={{
        engine: engineRef.current,
        active,
        settings,
        updateSettings: updateSettingsHandler,
        ready,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
