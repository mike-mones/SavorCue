import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { SessionEngine } from './engine';
import type { ActiveSession, AppSettings } from './types';
import { loadSettings, saveSettings } from './db';
import { DEFAULT_SETTINGS } from './defaults';

interface AppContextValue {
  engine: SessionEngine;
  active: ActiveSession | null;
  settings: AppSettings;
  updateSettings: (s: AppSettings) => Promise<void>;
  ready: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [active, setActive] = useState<ActiveSession | null>(null);
  const [ready, setReady] = useState(false);
  const engineRef = useRef<SessionEngine>(new SessionEngine(DEFAULT_SETTINGS));

  // Initialize
  useEffect(() => {
    let mounted = true;
    (async () => {
      const loaded = await loadSettings();
      if (!mounted) return;
      setSettings(loaded);
      engineRef.current.updateSettings(loaded);
      await engineRef.current.restore();
      setActive(engineRef.current.getActive());
      setReady(true);
    })();
    return () => { mounted = false; };
  }, []);

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
    setSettings(s);
    engineRef.current.updateSettings(s);
  }, []);

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
