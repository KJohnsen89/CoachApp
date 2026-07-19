import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Teams({ session }) {
  const [teams, setTeams] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [ageGroup, setAgeGroup] = useState('')
  const [trainers, setTrainers] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase
      .from('teams')
      .select('*')
      .order('name', { ascending: true })
    setTeams(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addTeam() {
    if (!name.trim()) return
    const { error } = await supabase.from('teams').insert({
      name: name.trim(),
      age_group: ageGroup.trim(),
      trainers: trainers.trim(),
      notes: notes.trim(),
      created_by: session.user.id,
    })
    if (!error) {
      setName(''); setAgeGroup(''); setTrainers(''); setNotes('')
      setShowForm(false)
      load()
    }
  }

  async function deleteTeam(id) {
    if (!confirm('Slet dette hold? Træninger knyttet til holdet beholder holdnavnet.')) return
    await supabase.from('teams').delete().eq('id', id)
    load()
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Hold</h1>
          <p className="page-sub">Oversigt over klubbens hold og hvem der træner dem.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Luk' : '+ Nyt hold'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <label className="field">
            <span>Holdnavn</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="F.eks. U10 Drenge" />
          </label>
          <label className="field">
            <span>Årgang / aldersgruppe</span>
            <input value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} placeholder="F.eks. 2016" />
          </label>
          <label className="field">
            <span>Trænere</span>
            <input value={trainers} onChange={(e) => setTrainers(e.target.value)} placeholder="F.eks. Kenneth, Lars" />
          </label>
          <label className="field">
            <span>Noter</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Antal spillere, baner, andet praktisk…" />
          </label>
          <button className="btn btn-primary" onClick={addTeam}>Gem hold</button>
        </div>
      )}

      {loading ? (
        <p className="muted">Henter hold…</p>
      ) : teams.length === 0 ? (
        <div className="empty">Ingen hold oprettet endnu. Tryk på "+ Nyt hold" for at komme i gang.</div>
      ) : (
        <div className="team-grid">
          {teams.map((t) => (
            <div key={t.id} className="card team-card">
              <div className="team-head">
                <h3>{t.name}</h3>
                {t.age_group && <span className="chip">{t.age_group}</span>}
              </div>
              {t.trainers && <p><span className="label">Trænere:</span> {t.trainers}</p>}
              {t.notes && <p className="muted">{t.notes}</p>}
              <button className="btn btn-ghost btn-small" onClick={() => deleteTeam(t.id)}>Slet</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
