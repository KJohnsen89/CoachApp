import { useEffect, useState } from 'react'
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Login from './pages/Login'
import Home from './pages/Home'
import Teams from './pages/Teams'
import Trainings from './pages/Trainings'
import Forum from './pages/Forum'
import Thread from './pages/Thread'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

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
            <NavLink to="/forum">Forum</NavLink>
          </nav>
          <div className="user-area">
            <span className="user-name">{displayName}</span>
            <button className="btn btn-ghost" onClick={logout}>Log ud</button>
          </div>
        </div>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Home session={session} />} />
          <Route path="/traeninger" element={<Trainings session={session} />} />
          <Route path="/hold" element={<Teams session={session} />} />
          <Route path="/forum" element={<Forum session={session} />} />
          <Route path="/forum/:threadId" element={<Thread session={session} />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="footer">Trænerportalen · lavet af trænere, til trænere</footer>
    </div>
  )
}
