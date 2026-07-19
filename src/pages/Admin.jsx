import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Admin({ session }) {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setProfiles(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function setStatus(userId, status) {
    const { error } = await supabase.from('profiles').update({ status }).eq('user_id', userId)
    if (error) alert('Kunne ikke opdatere: ' + error.message)
    load()
  }

  if (loading) return <div className="page"><p className="muted">Henter…</p></div>

  const pending = profiles.filter((p) => p.status === 'pending')
  const approved = profiles.filter((p) => p.status === 'approved')
  const rejected = profiles.filter((p) => p.status === 'rejected')

  return (
    <div className="page">
      <h1 className="page-title">Administration</h1>
      <p className="page-sub">Godkend nye trænere, og fjern adgang for andre om nødvendigt.</p>

      <h3 className="section-title">Afventer godkendelse ({pending.length})</h3>
      {pending.length === 0 ? (
        <p className="muted">Ingen anmodninger lige nu.</p>
      ) : (
        <ul className="admin-list">
          {pending.map((p) => (
            <li key={p.user_id} className="card admin-row">
              <div>
                <strong>{p.display_name || p.email}</strong>
                <p className="muted">{p.email} · anmodede {new Date(p.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}</p>
              </div>
              <div className="admin-actions">
                <button className="btn btn-primary btn-small" onClick={() => setStatus(p.user_id, 'approved')}>Godkend</button>
                <button className="btn btn-ghost btn-small" onClick={() => setStatus(p.user_id, 'rejected')}>Afvis</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h3 className="section-title">Godkendte trænere ({approved.length})</h3>
      <ul className="admin-list">
        {approved.map((p) => (
          <li key={p.user_id} className="card admin-row">
            <div>
              <strong>{p.display_name || p.email}</strong> {p.is_admin && <span className="chip chip-small">Admin</span>}
              <p className="muted">{p.email}</p>
            </div>
            {p.user_id !== session.user.id && (
              <div className="admin-actions">
                <button className="btn btn-ghost btn-small" onClick={() => setStatus(p.user_id, 'rejected')}>Fjern adgang</button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {rejected.length > 0 && (
        <>
          <h3 className="section-title">Afvist / fjernet adgang ({rejected.length})</h3>
          <ul className="admin-list">
            {rejected.map((p) => (
              <li key={p.user_id} className="card admin-row">
                <div>
                  <strong>{p.display_name || p.email}</strong>
                  <p className="muted">{p.email}</p>
                </div>
                <div className="admin-actions">
                  <button className="btn btn-ghost btn-small" onClick={() => setStatus(p.user_id, 'approved')}>Genopret adgang</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="card admin-note">
        <p className="muted">
          For at slette en persons konto helt (så vedkommende forsvinder fuldstændigt og kan oprette sig igen med samme e-mail), skal du ind i selve Supabase: <strong>Authentication → Users</strong> → find personen → <strong>Delete user</strong>. Det kan ikke gøres herfra, af sikkerhedsmæssige årsager.
        </p>
      </div>
    </div>
  )
}
