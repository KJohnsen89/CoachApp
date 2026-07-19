import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Settings({ session }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)

  const displayName =
    session.user.user_metadata?.display_name || session.user.email

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

  return (
    <div className="page">
      <h1 className="page-title">Indstillinger</h1>
      <p className="page-sub">Logget ind som {displayName} ({session.user.email})</p>

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
