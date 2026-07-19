import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const emptyExercise = { name: '', minutes: '', description: '' }

export default function Trainings({ session }) {
  const [trainings, setTrainings] = useState([])
  const [teams, setTeams] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [showPast, setShowPast] = useState(false)
  const [loading, setLoading] = useState(true)

  // form state
  const [teamName, setTeamName] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [place, setPlace] = useState('')
  const [theme, setTheme] = useState('')
  const [exercises, setExercises] = useState([{ ...emptyExercise }])

  const authorName =
    session.user.user_metadata?.display_name || session.user.email

  async function load() {
    const [tr, tm] = await Promise.all([
      supabase.from('trainings').select('*').order('date', { ascending: true }).order('time', { ascending: true }),
      supabase.from('teams').select('name').order('name'),
    ])
    setTrainings(tr.data || [])
    setTeams(tm.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function updateExercise(i, field, value) {
    setExercises(exercises.map((ex, idx) => (idx === i ? { ...ex, [field]: value } : ex)))
  }

  function addExerciseRow() {
    setExercises([...exercises, { ...emptyExercise }])
  }

  function removeExerciseRow(i) {
    setExercises(exercises.filter((_, idx) => idx !== i))
  }

  async function addTraining() {
    if (!date || !teamName.trim()) {
      alert('Vælg mindst en dato og et hold.')
      return
    }
    const cleanExercises = exercises
      .filter((ex) => ex.name.trim())
      .map((ex) => ({
        name: ex.name.trim(),
        minutes: ex.minutes ? Number(ex.minutes) : null,
        description: ex.description.trim(),
      }))

    const { error } = await supabase.from('trainings').insert({
      team_name: teamName.trim(),
      date,
      time: time || null,
      place: place.trim(),
      theme: theme.trim(),
      exercises: cleanExercises,
      created_by: session.user.id,
      created_by_name: authorName,
    })
    if (!error) {
      setTeamName(''); setDate(''); setTime(''); setPlace(''); setTheme('')
      setExercises([{ ...emptyExercise }])
      setShowForm(false)
      load()
    } else {
      alert('Kunne ikke gemme træningen: ' + error.message)
    }
  }

  async function deleteTraining(id) {
    if (!confirm('Slet denne træning?')) return
    await supabase.from('trainings').delete().eq('id', id)
    load()
  }

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = trainings.filter((t) => t.date >= today)
  const past = trainings.filter((t) => t.date < today).reverse()
  const shown = showPast ? past : upcoming

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Træninger</h1>
          <p className="page-sub">Planlæg træninger med dato, sted og øvelser — så alle trænere ved hvad der skal ske.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Luk' : '+ Ny træning'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <div className="form-row">
            <label className="field">
              <span>Hold</span>
              <input
                list="team-options"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Vælg eller skriv holdnavn"
              />
              <datalist id="team-options">
                {teams.map((t) => <option key={t.name} value={t.name} />)}
              </datalist>
            </label>
            <label className="field">
              <span>Dato</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="field">
              <span>Tidspunkt</span>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </label>
          </div>

          <div className="form-row">
            <label className="field">
              <span>Sted</span>
              <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="F.eks. Bane 2" />
            </label>
            <label className="field">
              <span>Tema for træningen</span>
              <input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="F.eks. Afslutninger og 1. berøring" />
            </label>
          </div>

          <h3 className="section-title">Øvelser</h3>
          {exercises.map((ex, i) => (
            <div key={i} className="exercise-row">
              <input
                className="ex-name"
                value={ex.name}
                onChange={(e) => updateExercise(i, 'name', e.target.value)}
                placeholder={`Øvelse ${i + 1} — f.eks. Firkant-leg`}
              />
              <input
                className="ex-minutes"
                type="number"
                min="0"
                value={ex.minutes}
                onChange={(e) => updateExercise(i, 'minutes', e.target.value)}
                placeholder="Min."
              />
              <input
                className="ex-desc"
                value={ex.description}
                onChange={(e) => updateExercise(i, 'description', e.target.value)}
                placeholder="Kort beskrivelse (opstilling, fokuspunkter…)"
              />
              {exercises.length > 1 && (
                <button className="btn btn-ghost btn-small" onClick={() => removeExerciseRow(i)} title="Fjern øvelse">✕</button>
              )}
            </div>
          ))}
          <button className="btn btn-ghost" onClick={addExerciseRow}>+ Tilføj øvelse</button>

          <div className="form-actions">
            <button className="btn btn-primary" onClick={addTraining}>Gem træning</button>
          </div>
        </div>
      )}

      <div className="toggle-row">
        <button className={`btn btn-toggle ${!showPast ? 'active' : ''}`} onClick={() => setShowPast(false)}>
          Kommende ({upcoming.length})
        </button>
        <button className={`btn btn-toggle ${showPast ? 'active' : ''}`} onClick={() => setShowPast(true)}>
          Afholdte ({past.length})
        </button>
      </div>

      {loading ? (
        <p className="muted">Henter træninger…</p>
      ) : shown.length === 0 ? (
        <div className="empty">
          {showPast ? 'Ingen afholdte træninger endnu.' : 'Ingen kommende træninger. Opret én med "+ Ny træning".'}
        </div>
      ) : (
        <ul className="training-list">
          {shown.map((t) => (
            <li key={t.id} className="card training-card">
              <div className="training-head">
                <div className="training-when">
                  <span className="training-date">
                    {new Date(t.date + 'T00:00:00').toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                  {t.time && <span className="training-time">kl. {t.time.slice(0, 5)}</span>}
                </div>
                <span className="chip">{t.team_name}</span>
              </div>

              {t.theme && <p className="training-theme">{t.theme}</p>}
              {t.place && <p className="muted">📍 {t.place}</p>}

              {t.exercises && t.exercises.length > 0 && (
                <div className="exercise-plan">
                  {t.exercises.map((ex, i) => (
                    <div key={i} className="exercise-item">
                      <div className="exercise-item-head">
                        <strong>{ex.name}</strong>
                        {ex.minutes && <span className="chip chip-small">{ex.minutes} min</span>}
                      </div>
                      {ex.description && <p className="muted">{ex.description}</p>}
                    </div>
                  ))}
                </div>
              )}

              <div className="training-foot">
                <span className="muted">Oprettet af {t.created_by_name}</span>
                {t.created_by === session.user.id && (
                  <button className="btn btn-ghost btn-small" onClick={() => deleteTraining(t.id)}>Slet</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
