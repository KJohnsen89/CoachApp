import { useEffect, useState } from 'react'
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Login from './pages/Login'
import Home from './pages/Home'
import Teams from './pages/Teams'
import AllPlayers from './pages/AllPlayers'
import Trainings from './pages/Trainings'
import TrainingDetail from './pages/TrainingDetail'
import Forum from './pages/Forum'
import Thread from './pages/Thread'
import Referater from './pages/Referater'
import Rules from './pages/Rules'
import Settings from './pages/Settings'
import Admin from './pages/Admin'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [profile, setProfile] = useState(undefined) // undefined = loading, null = ingen profil fundet
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) { setProfile(undefined); return }
    let cancelled = false
    supabase.from('profiles').select('*').eq('user_id', session.user.id).single()
      .then(({ data }) => { if (!cancelled) setProfile(data || null) })
    return () => { cancelled = true }
  }, [session])

  async function logout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (session === undefined) {
    return <div className="loading">Indlæser…</div>
  }

  if (!session) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  if (profile === undefined) {
    return <div className="loading">Indlæser…</div>
  }

  if (!profile || profile.status !== 'approved') {
    const status = profile?.status || 'pending'
    return (
      <div className="approval-screen">
        <div className="approval-card">
          <div className="brand login-brand">
            <span className="brand-mark" aria-hidden="true"></span>
            <span className="brand-name">Trænerportalen</span>
          </div>
          {status === 'rejected' ? (
            <>
              <h2>Adgang ikke godkendt</h2>
              <p className="muted">Din anmodning om adgang er ikke blevet godkendt. Kontakt en administrator, hvis du mener det er en fejl.</p>
            </>
          ) : (
            <>
              <h2>Afventer godkendelse</h2>
              <p className="muted">Din konto skal godkendes af en administrator, før du kan bruge Trænerportalen. Prøv igen senere, eller hør fra en af trænerne.</p>
            </>
          )}
          <button className="btn btn-ghost" onClick={logout}>Log ud</button>
        </div>
      </div>
    )
  }

  const displayName =
    session.user.user_metadata?.display_name || session.user.email

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true"></span>
            <span className="brand-name">Trænerportalen</span>
          </div>
          <nav className="nav">
            <NavLink to="/" end>Opslag</NavLink>
            <NavLink to="/traeninger">Træninger</NavLink>
            <NavLink to="/hold">Hold</NavLink>
            <NavLink to="/spillere">Spillere</NavLink>
            <NavLink to="/forum">Forum</NavLink>
            <NavLink to="/referater">Referater</NavLink>
            <NavLink to="/regler">Regler</NavLink>
            {profile.is_admin && <NavLink to="/admin">Admin</NavLink>}
          </nav>
          <div className="user-area">
            <NavLink to="/indstillinger" className="settings-link" title="Indstillinger">⚙︎</NavLink>
            <span className="user-name">{displayName}</span>
            <button className="btn btn-ghost" onClick={logout}>Log ud</button>
          </div>
        </div>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Home session={session} profile={profile} />} />
          <Route path="/traeninger" element={<Trainings session={session} />} />
          <Route path="/traeninger/:trainingId" element={<TrainingDetail session={session} profile={profile} />} />
          <Route path="/hold" element={<Teams session={session} />} />
          <Route path="/spillere" element={<AllPlayers />} />
          <Route path="/forum" element={<Forum session={session} />} />
          <Route path="/forum/:threadId" element={<Thread session={session} profile={profile} />} />
          <Route path="/referater" element={<Referater session={session} profile={profile} />} />
          <Route path="/regler" element={<Rules session={session} profile={profile} />} />
          <Route path="/indstillinger" element={<Settings session={session} />} />
          {profile.is_admin && <Route path="/admin" element={<Admin session={session} />} />}
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="footer">Trænerportalen · lavet af trænere, til trænere</footer>
    </div>
  )
}
