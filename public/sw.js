// Service worker til Trænerportalen — håndterer push-notifikationer i baggrunden
// og holder styr på app-ikonets badge-tal (antal ulæste).

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

async function getBadgeCount() {
  try {
    const db = await openBadgeDB()
    return await new Promise((resolve) => {
      const tx = db.transaction(BADGE_STORE, 'readonly')
      const req = tx.objectStore(BADGE_STORE).get('count')
      req.onsuccess = () => resolve(req.result || 0)
      req.onerror = () => resolve(0)
    })
  } catch (e) {
    return 0
  }
}

async function setBadgeCount(count) {
  try {
    const db = await openBadgeDB()
    await new Promise((resolve) => {
      const tx = db.transaction(BADGE_STORE, 'readwrite')
      tx.objectStore(BADGE_STORE).put(count, 'count')
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch (e) {
    // Badge er "nice to have" — må aldrig vælte selve push-beskeden
  }
}

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = { title: 'Trænerportalen', body: event.data ? event.data.text() : '' }
  }

  const title = data.title || 'Trænerportalen'
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: data.url || '/' },
  }

  event.waitUntil((async () => {
    const next = (await getBadgeCount()) + 1
    await setBadgeCount(next)
    if ('setAppBadge' in self.navigator) {
      try { await self.navigator.setAppBadge(next) } catch (e) { /* ignorer */ }
    }
    await self.registration.showNotification(title, options)
  })())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'

  event.waitUntil((async () => {
    // Klikker man på en notifikation, betragtes alt som "set" — nulstil badge
    await setBadgeCount(0)
    if ('clearAppBadge' in self.navigator) {
      try { await self.navigator.clearAppBadge() } catch (e) { /* ignorer */ }
    }

    const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of windowClients) {
      if (client.url.includes(self.location.origin) && 'focus' in client) {
        client.navigate(url)
        return client.focus()
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(url)
  })())
})
