import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('Kunne ikke registrere service worker:', err)
    })
  })
}

// Nulstil app-ikonets badge-tal, hver gang appen åbnes eller kommer i forgrunden —
// at åbne appen tæller som "set", uanset om man klikkede på en notifikation eller ej.
const BADGE_DB = 'traenerportalen-badge'
const BADGE_STORE = 'badge'

function openBadgeDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(BADGE_DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(BADGE_STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function clearBadge() {
  try {
    if ('clearAppBadge' in navigator) await navigator.clearAppBadge()
    const db = await openBadgeDB()
    await new Promise((resolve) => {
      const tx = db.transaction(BADGE_STORE, 'readwrite')
      tx.objectStore(BADGE_STORE).put(0, 'count')
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch (e) {
    // Badge er "nice to have" — ingen grund til at afbryde appen på fejl
  }
}

clearBadge()
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') clearBadge()
})
