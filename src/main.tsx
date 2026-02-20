import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register single service worker for both PWA caching and FCM
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js').then((reg) => {
    // Check for updates every 30 seconds
    setInterval(() => reg.update(), 30000);
  }).catch(() => {});
}
