import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context';
import { AuthProvider, useAuth } from './authContext';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import PreMealScreen from './screens/PreMealScreen';
import ActiveMealScreen from './screens/ActiveMealScreen';
import EndMealScreen from './screens/EndMealScreen';
import SummaryScreen from './screens/SummaryScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';

function AppRoutes() {
  const { ready } = useApp();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/pre-meal" element={<PreMealScreen />} />
      <Route path="/meal" element={<ActiveMealScreen />} />
      <Route path="/end-meal" element={<EndMealScreen />} />
      <Route path="/summary" element={<SummaryScreen />} />
      <Route path="/analytics" element={<AnalyticsScreen />} />
      <Route path="/history" element={<HistoryScreen />} />
      <Route path="/settings" element={<SettingsScreen />} />
    </Routes>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400 text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
