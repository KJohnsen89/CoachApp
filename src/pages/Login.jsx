import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit() {
    setError('')
    setInfo('')
    if (!email || !password) {
      setError('Udfyld både e-mail og adgangskode.')
      return
    }
    setBusy(true)
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('Kunne ikke logge ind. Tjek e-mail og adgangskode.')
    } else {
      if (!name) {
        setError('Skriv dit navn, så de andre trænere kan se hvem du er.')
        setBusy(false)
        return
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name } },
      })
      if (error) {
        setError('Kunne ikke oprette kontoen: ' + error.message)
      } else {
        setInfo('Kontoen er oprettet. Hvis du ikke bliver logget ind automatisk, så tjek din e-mail for et bekræftelseslink.')
      }
    }
    setBusy(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand login-brand">
          <span className="brand-mark" aria-hidden="true"></span>
          <span className="brand-name">Trænerportalen</span>
        </div>
        <p className="login-sub">Fælles sted for trænere: træninger, hold og forum.</p>

        {mode === 'signup' && (
          <label className="field">
            <span>Dit navn</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="F.eks. Kenneth"
            />
          </label>
        )}

        <label className="field">
          <span>E-mail</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="din@mail.dk"
          />
        </label>

        <label className="field">
          <span>Adgangskode</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mindst 6 tegn"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </label>

        {error && <p className="msg msg-error">{error}</p>}
        {info && <p className="msg msg-info">{info}</p>}

        <button className="btn btn-primary btn-full" onClick={handleSubmit} disabled={busy}>
          {busy ? 'Vent…' : mode === 'login' ? 'Log ind' : 'Opret konto'}
        </button>

        <button
          className="btn btn-link"
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setInfo('') }}
        >
          {mode === 'login' ? 'Ny træner? Opret en konto' : 'Har du allerede en konto? Log ind'}
        </button>
      </div>
    </div>
  )
}
