import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Settings({ session }) {
  const [notifyPosts, setNotifyPosts] = useState(false)
  const [notifyTrainings, setNotifyTrainings] = useState(false)
  const [notifyForum, setNotifyForum] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)

  const displayName =
    session.user.user_metadata?.display_name || session.user.email

  useEffect(() => {
    supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setNotifyPosts(data.notify_posts)
          setNotifyTrainings(data.notify_trainings)
          setNotifyForum(data.notify_forum)
        }
        setLoading(false)
      })
  }, [])

  async function save() {
    setSaved(false)
    const { error } = await supabase.from('notification_settings').upsert({
      user_id: session.user.id,
      email: session.user.email,
      display_name: displayName,
      notify_posts: notifyPosts,
      notify_trainings: notifyTrainings,
      notify_forum: notifyForum,
      updated_at: new Date().toISOString(),
    })
    if (error) {
      alert('Kunne ikke gemme indstillingerne: ' + error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

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

  if (loading) return <div className="page"><p className="muted">Henter indstillinger…</p></div>

  return (
    <div className="page">
      <h1 className="page-title">Indstillinger</h1>
      <p className="page-sub">Logget ind som {displayName} ({session.user.email})</p>

      <div className="card">
        <h3 className="section-title">E-mail-notifikationer</h3>
        <p className="muted">Vælg hvad du vil have besked om på e-mail ({session.user.email}):</p>

        <label className="check-row">
          <input type="checkbox" checked={notifyPosts} onChange={(e) => setNotifyPosts(e.target.checked)} />
          <span>Nye opslag</span>
        </label>
        <label className="check-row">
          <input type="checkbox" checked={notifyTrainings} onChange={(e) => setNotifyTrainings(e.target.checked)} />
          <span>Nye træninger</span>
        </label>
        <label className="check-row">
          <input type="checkbox" checked={notifyForum} onChange={(e) => setNotifyForum(e.target.checked)} />
          <span>Nye forum-diskussioner og svar</span>
        </label>

        <div className="form-actions">
          <button className="btn btn-primary" onClick={save}>Gem indstillinger</button>
          {saved && <span className="msg msg-info inline-msg">Gemt ✓</span>}
        </div>
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
