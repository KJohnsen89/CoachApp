import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export default function Settings({ session }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)

  const [pushSupported, setPushSupported] = useState(true)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)
  const [pushMsg, setPushMsg] = useState('')

  const displayName =
    session.user.user_metadata?.display_name || session.user.email

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushSupported(false)
      return
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      setPushEnabled(!!sub)
    })
  }, [])

  async function changePassword() {
    setPwError(''); setPwSuccess(false)
    if (newPassword.length < 6) {
      setPwError('Adgangskoden skal være mindst 6 tegn.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError('De to adgangskoder er ikke ens.')
      return
    }
    setPwSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPwError('Kunne ikke skifte adgangskode: ' + error.message)
    } else {
      setPwSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
    }
    setPwSaving(false)
  }

  async function enablePush() {
    setPushMsg('')
    if (!VAPID_PUBLIC_KEY) {
      setPushMsg('Push er ikke sat op af administratoren endnu (mangler VITE_VAPID_PUBLIC_KEY).')
      return
    }
    setPushBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setPushMsg('Du skal give tilladelse til notifikationer i din browser/telefon for at slå dem til.')
        setPushBusy(false)
        return
      }
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })
      }
      const subJson = sub.toJSON()
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: session.user.id,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
      }, { onConflict: 'endpoint' })
      if (error) throw new Error(error.message)
      setPushEnabled(true)
      setPushMsg('Push-notifikationer er slået til ✓')
    } catch (e) {
      setPushMsg('Kunne ikke slå notifikationer til: ' + e.message)
    }
    setPushBusy(false)
  }

  async function disablePush() {
    setPushBusy(true)
    setPushMsg('')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        await sub.unsubscribe()
      }
      setPushEnabled(false)
      setPushMsg('Push-notifikationer er slået fra.')
    } catch (e) {
      setPushMsg('Kunne ikke slå notifikationer fra: ' + e.message)
    }
    setPushBusy(false)
  }

  async function sendTestPush() {
    setPushMsg('')
    setPushBusy(true)
    const { error } = await supabase.functions.invoke('send-push', {
      body: { test: true, user_id: session.user.id },
    })
    if (error) setPushMsg('Kunne ikke sende test: ' + error.message)
    else setPushMsg('Test-notifikation sendt — tjek din telefon om et øjeblik.')
    setPushBusy(false)
  }

  return (
    <div className="page">
      <h1 className="page-title">Indstillinger</h1>
      <p className="page-sub">Logget ind som {displayName} ({session.user.email})</p>

      <div className="card">
        <h3 className="section-title">Push-notifikationer</h3>
        <p className="muted">
          Få besked direkte på din telefon, når der kommer nye opslag, træninger eller forum-indhold.
          {' '}På iPhone virker det kun, når appen er tilføjet til hjemmeskærmen (Del-ikon → "Føj til hjemmeskærm").
        </p>

        {!pushSupported ? (
          <p className="msg msg-error">Din browser understøtter ikke push-notifikationer.</p>
        ) : (
          <>
            <div className="form-actions">
              {pushEnabled ? (
                <button className="btn btn-ghost" onClick={disablePush} disabled={pushBusy}>
                  {pushBusy ? 'Vent…' : 'Slå fra'}
                </button>
              ) : (
                <button className="btn btn-primary" onClick={enablePush} disabled={pushBusy}>
                  {pushBusy ? 'Vent…' : 'Slå til'}
                </button>
              )}
              {pushEnabled && (
                <button className="btn btn-ghost" onClick={sendTestPush} disabled={pushBusy}>
                  Send test-notifikation
                </button>
              )}
            </div>
            {pushMsg && <p className="msg msg-info">{pushMsg}</p>}
          </>
        )}
      </div>

      <div className="card">
        <h3 className="section-title">Skift adgangskode</h3>
        <label className="field">
          <span>Ny adgangskode</span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mindst 6 tegn"
          />
        </label>
        <label className="field">
          <span>Bekræft ny adgangskode</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && changePassword()}
          />
        </label>
        {pwError && <p className="msg msg-error">{pwError}</p>}
        {pwSuccess && <p className="msg msg-info">Adgangskoden er skiftet ✓</p>}
        <div className="form-actions">
          <button className="btn btn-primary" onClick={changePassword} disabled={pwSaving}>
            {pwSaving ? 'Skifter…' : 'Skift adgangskode'}
          </button>
        </div>
      </div>
    </div>
  )
}
