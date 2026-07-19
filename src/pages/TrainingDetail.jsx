import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import MediaFields, { MediaView, uploadImages, cleanLinks } from '../components/MediaFields'

const emptyExercise = { name: '', minutes: '', description: '' }
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

export default function TrainingDetail({ session }) {
  const { trainingId } = useParams()
  const [training, setTraining] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const myName = session.user.user_metadata?.display_name || session.user.email

  // redigering
  const [editing, setEditing] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [date, setDate] = useState('')
  const [hour, setHour] = useState('')
  const [minute, setMinute] = useState('00')
  const [place, setPlace] = useState('')
  const [theme, setTheme] = useState('')
  const [exercises, setExercises] = useState([{ ...emptyExercise }])
  const [links, setLinks] = useState([''])
  const [existingImages, setExistingImages] = useState([])
  const [newImageFiles, setNewImageFiles] = useState([])
  const [seriesCount, setSeriesCount] = useState(1)

  async function load() {
    const [t, a, tm] = await Promise.all([
      supabase.from('trainings').select('*').eq('id', trainingId).single(),
      supabase.from('training_attendance').select('*').eq('training_id', trainingId),
      supabase.from('teams').select('name').order('name'),
    ])
    setTraining(t.data)
    setAttendance(a.data || [])
    setTeams(tm.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [trainingId])

  async function setMyStatus(status) {
    const mine = attendance.find((a) => a.user_id === session.user.id)
    if (mine && mine.status === status) {
      await supabase.from('training_attendance').delete()
        .eq('training_id', trainingId).eq('user_id', session.user.id)
    } else {
      await supabase.from('training_attendance').upsert({
        training_id: trainingId,
        user_id: session.user.id,
        user_name: myName,
        status,
        updated_at: new Date().toISOString(),
      })
    }
    load()
  }

  async function deleteTraining() {
    if (!confirm('Slet denne træning?')) return
    await supabase.from('trainings').delete().eq('id', trainingId)
    navigate('/traeninger')
  }

  function copyTraining() {
    navigate('/traeninger', { state: { copyFrom: training } })
  }

  function openEdit() {
    setTeamName(training.team_name || '')
    setDate(training.date || '')
    if (training.time) { setHour(training.time.slice(0, 2)); setMinute(training.time.slice(3, 5)) }
    else { setHour(''); setMinute('00') }
    setPlace(training.place || '')
    setTheme(training.theme || '')
    setExercises(training.exercises?.length ? training.exercises.map(ex => ({
      name: ex.name || '', minutes: ex.minutes ?? '', description: ex.description || ''
    })) : [{ ...emptyExercise }])
    setLinks(training.links?.length ? [...training.links] : [''])
    setExistingImages(training.images || [])
    setNewImageFiles([])
    setSeriesCount(1)
    if (training.series_id) {
      supabase.from('trainings').select('id', { count: 'exact', head: true }).eq('series_id', training.series_id)
        .then(({ count }) => setSeriesCount(count || 1))
    }
    setEditing(true)
    window.scrollTo(0, 0)
  }

  function updateExercise(i, field, value) {
    setExercises(exercises.map((ex, idx) => (idx === i ? { ...ex, [field]: value } : ex)))
  }

  async function saveEdit(scope) {
    if (!date || !teamName.trim()) {
      alert('Vælg mindst en dato og et hold.')
      return
    }
    setSaving(true)
    try {
      const cleanExercises = exercises
        .filter((ex) => String(ex.name).trim())
        .map((ex) => ({
          name: String(ex.name).trim(),
          minutes: ex.minutes ? Number(ex.minutes) : null,
          description: String(ex.description).trim(),
        }))
      const uploadedUrls = await uploadImages(newImageFiles, session.user.id)
      const allImages = [...existingImages, ...uploadedUrls]
      const time = hour !== '' ? `${hour}:${minute}` : null

      const sharedFields = {
        team_name: teamName.trim(),
        time,
        place: place.trim(),
        theme: theme.trim(),
        exercises: cleanExercises,
        links: cleanLinks(links),
        images: allImages,
      }

      if (scope === 'series' && training.series_id) {
        // Opdatér de fælles felter på ALLE træninger i serien...
        const { error: err1 } = await supabase.from('trainings').update(sharedFields).eq('series_id', training.series_id)
        if (err1) throw new Error(err1.message)
        // ...men datoen gælder kun denne ene forekomst
        const { error: err2 } = await supabase.from('trainings').update({ date }).eq('id', trainingId)
        if (err2) throw new Error(err2.message)
      } else {
        const { error } = await supabase.from('trainings').update({ ...sharedFields, date }).eq('id', trainingId)
        if (error) throw new Error(error.message)
      }
      setEditing(false)
      load()
    } catch (e) {
      alert('Kunne ikke gemme ændringerne: ' + e.message)
    }
    setSaving(false)
  }

  if (loading) return <div className="page"><p className="muted">Henter træning…</p></div>
  if (!training) return <div className="page"><p>Træningen findes ikke. <Link to="/traeninger">Tilbage til træninger</Link></p></div>

  const totalMinutes = (training.exercises || []).reduce((sum, ex) => sum + (Number(ex.minutes) || 0), 0)
  const myStatus = attendance.find((a) => a.user_id === session.user.id)?.status
  const coming = attendance.filter((a) => a.status === 'kommer')
  const notComing = attendance.filter((a) => a.status === 'kommer_ikke')
  const canEdit = training.created_by === session.user.id

  return (
    <div className="page">
      <Link to="/traeninger" className="back-link">← Tilbage til træninger</Link>

      {editing ? (
        <div className="card form-card">
          <h3 className="section-title">Redigér træning</h3>
          <div className="form-row">
            <label className="field">
              <span>Hold</span>
              <input list="team-options-detail" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
              <datalist id="team-options-detail">
                {teams.map((t) => <option key={t.name} value={t.name} />)}
              </datalist>
            </label>
            <label className="field">
              <span>Dato</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <div className="field">
              <span>Tidspunkt (24 timer)</span>
              <div className="time-select">
                <select value={hour} onChange={(e) => setHour(e.target.value)}>
                  <option value="">– Time –</option>
                  {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
                <span className="time-colon">:</span>
                <select value={minute} onChange={(e) => setMinute(e.target.value)}>
                  {MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="form-row">
            <label className="field">
              <span>Sted</span>
              <input value={place} onChange={(e) => setPlace(e.target.value)} />
            </label>
            <label className="field">
              <span>Tema for træningen</span>
              <input value={theme} onChange={(e) => setTheme(e.target.value)} />
            </label>
          </div>

          <h3 className="section-title">Øvelser</h3>
          {exercises.map((ex, i) => (
            <div key={i} className="exercise-row">
              <input className="ex-name" value={ex.name} onChange={(e) => updateExercise(i, 'name', e.target.value)} placeholder={`Øvelse ${i + 1}`} />
              <input className="ex-minutes" type="number" min="0" value={ex.minutes} onChange={(e) => updateExercise(i, 'minutes', e.target.value)} placeholder="Min." />
              <input className="ex-desc" value={ex.description} onChange={(e) => updateExercise(i, 'description', e.target.value)} placeholder="Beskrivelse" />
              {exercises.length > 1 && (
                <button className="btn btn-ghost btn-small" onClick={() => setExercises(exercises.filter((_, idx) => idx !== i))}>✕</button>
              )}
            </div>
          ))}
          <button className="btn btn-ghost" onClick={() => setExercises([...exercises, { ...emptyExercise }])}>+ Tilføj øvelse</button>

          <h3 className="section-title">Links & billeder</h3>
          <MediaFields
            links={links} setLinks={setLinks}
            existingImages={existingImages} setExistingImages={setExistingImages}
            newImageFiles={newImageFiles} setNewImageFiles={setNewImageFiles}
          />

          {training.series_id ? (
            <div className="scope-choice">
              <p className="muted">Denne træning er del af en serie på {seriesCount} træninger.</p>
              <div className="detail-actions">
                <button className="btn btn-ghost" onClick={() => saveEdit('this')} disabled={saving}>Gem kun denne dato</button>
                <button className="btn btn-primary" onClick={() => saveEdit('series')} disabled={saving}>
                  {saving ? 'Gemmer…' : `Gem for hele serien (${seriesCount} stk)`}
                </button>
                <button className="btn btn-link" onClick={() => setEditing(false)}>Annullér</button>
              </div>
            </div>
          ) : (
            <div className="form-actions">
              <button className="btn btn-primary" onClick={() => saveEdit('this')} disabled={saving}>
                {saving ? 'Gemmer…' : 'Gem ændringer'}
              </button>
              <button className="btn btn-link" onClick={() => setEditing(false)}>Annullér</button>
            </div>
          )}
        </div>
      ) : (
        <div className="card training-detail">
          <div className="training-head">
            <div>
              <h1 className="page-title">
                {new Date(training.date + 'T00:00:00').toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h1>
              {training.time && <p className="training-time-big">kl. {training.time.slice(0, 5)}</p>}
            </div>
            <span className="chip">{training.team_name}</span>
          </div>

          {training.theme && <p className="training-theme">{training.theme}</p>}
          {training.place && <p className="muted">📍 {training.place}</p>}
          {training.series_id && <p className="muted">🔁 Del af en træningsserie</p>}

          <div className="attendance-box">
            <h3 className="section-title">Deltager du?</h3>
            <div className="attendance-buttons">
              <button className={`btn ${myStatus === 'kommer' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMyStatus('kommer')}>✓ Jeg deltager</button>
              <button className={`btn ${myStatus === 'kommer_ikke' ? 'btn-danger' : 'btn-ghost'}`} onClick={() => setMyStatus('kommer_ikke')}>✕ Jeg kommer ikke</button>
            </div>
            <div className="attendance-lists">
              <div>
                <span className="attend-label attend-yes">Kommer ({coming.length})</span>
                {coming.length > 0 ? <p className="muted">{coming.map((a) => a.user_name).join(', ')}</p> : <p className="muted">Ingen tilmeldt endnu.</p>}
              </div>
              {notComing.length > 0 && (
                <div>
                  <span className="attend-label attend-no">Kommer ikke ({notComing.length})</span>
                  <p className="muted">{notComing.map((a) => a.user_name).join(', ')}</p>
                </div>
              )}
            </div>
          </div>

          {training.exercises?.length > 0 && (
            <>
              <h3 className="section-title">
                Øvelser {totalMinutes > 0 && <span className="muted">· i alt {totalMinutes} min</span>}
              </h3>
              <div className="exercise-plan">
                {training.exercises.map((ex, i) => (
                  <div key={i} className="exercise-item">
                    <div className="exercise-item-head">
                      <strong>{ex.name}</strong>
                      {ex.minutes && <span className="chip chip-small">{ex.minutes} min</span>}
                    </div>
                    {ex.description && <p className="muted">{ex.description}</p>}
                  </div>
                ))}
              </div>
            </>
          )}

          {(training.links?.length > 0 || training.images?.length > 0) && (
            <>
              <h3 className="section-title">Links & billeder</h3>
              <MediaView images={training.images} links={training.links} />
            </>
          )}

          <div className="training-foot detail-foot">
            <span className="muted">Oprettet af {training.created_by_name}</span>
            <div className="detail-actions">
              <button className="btn btn-primary" onClick={copyTraining}>Kopiér til ny træning</button>
              {canEdit && (
                <>
                  <button className="btn btn-ghost" onClick={openEdit}>Redigér</button>
                  <button className="btn btn-ghost" onClick={deleteTraining}>Slet</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
