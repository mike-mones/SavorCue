import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AppProvider, useApp } from './context';
import { AuthProvider, useAuth } from './authContext';
import LoginScreen from './screens/LoginScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import PreMealScreen from './screens/PreMealScreen';
import ActiveMealScreen from './screens/ActiveMealScreen';
import EndMealScreen from './screens/EndMealScreen';
import SummaryScreen from './screens/SummaryScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProfileScreen from './screens/ProfileScreen';
import TabBar from './components/TabBar';

function AppRoutes() {
  const { ready, active } = useApp();

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0f0f', color: '#555' }}>
        <p>Loading...</p>
      </div>
    );
  }

  // If there's an active meal, redirect to it
  if (active && !['/meal', '/end-meal'].includes(window.location.pathname)) {
    return <Navigate to="/meal" replace />;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/analytics" replace />} />
        <Route path="/pre-meal" element={<PreMealScreen />} />
        <Route path="/meal" element={<ActiveMealScreen />} />
        <Route path="/end-meal" element={<EndMealScreen />} />
        <Route path="/summary" element={<SummaryScreen />} />
        <Route path="/analytics" element={<AnalyticsScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
      </Routes>
      <TabBar />
    </>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('savorcue_onboarded') === '1');

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#faf9f7', color: '#8a8a8a' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (!onboarded) {
    return <OnboardingScreen onComplete={() => setOnboarded(true)} />;
  }

  return (
    <AppProvider>
      <div style={{ minHeight: '100vh', backgroundColor: '#faf9f7' }}>
        <AppRoutes />
      </div>
    </AppProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </BrowserRouter>
  );
}
