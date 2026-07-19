import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const emptyExercise = { name: '', minutes: '', description: '' }
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

export default function Trainings({ session }) {
  const [trainings, setTrainings] = useState([])
  const [teams, setTeams] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [showPast, setShowPast] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // form state
  const [teamName, setTeamName] = useState('')
  const [date, setDate] = useState('')
  const [hour, setHour] = useState('')
  const [minute, setMinute] = useState('00')
  const [place, setPlace] = useState('')
  const [theme, setTheme] = useState('')
  const [exercises, setExercises] = useState([{ ...emptyExercise }])
  const [links, setLinks] = useState([''])
  const [existingImages, setExistingImages] = useState([]) // urls fra kopieret træning
  const [newImageFiles, setNewImageFiles] = useState([])

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

  // Modtag en kopieret træning fra detaljesiden
  useEffect(() => {
    const copy = location.state?.copyFrom
    if (copy) {
      setTeamName(copy.team_name || '')
      setDate('') // ny dato skal vælges
      if (copy.time) {
        setHour(copy.time.slice(0, 2))
        setMinute(copy.time.slice(3, 5))
      }
      setPlace(copy.place || '')
      setTheme(copy.theme || '')
      setExercises(copy.exercises?.length ? copy.exercises.map(ex => ({
        name: ex.name || '', minutes: ex.minutes ?? '', description: ex.description || ''
      })) : [{ ...emptyExercise }])
      setLinks(copy.links?.length ? [...copy.links] : [''])
      setExistingImages(copy.images || [])
      setShowForm(true)
      // ryd state så det ikke gentages ved refresh
      navigate('.', { replace: true, state: {} })
      window.scrollTo(0, 0)
    }
  }, [location.state])

  function startCopy(t) {
    setTeamName(t.team_name || '')
    setDate('')
    if (t.time) { setHour(t.time.slice(0, 2)); setMinute(t.time.slice(3, 5)) }
    setPlace(t.place || '')
    setTheme(t.theme || '')
    setExercises(t.exercises?.length ? t.exercises.map(ex => ({
      name: ex.name || '', minutes: ex.minutes ?? '', description: ex.description || ''
    })) : [{ ...emptyExercise }])
    setLinks(t.links?.length ? [...t.links] : [''])
    setExistingImages(t.images || [])
    setNewImageFiles([])
    setShowForm(true)
    window.scrollTo(0, 0)
  }

  function resetForm() {
    setTeamName(''); setDate(''); setHour(''); setMinute('00')
    setPlace(''); setTheme('')
    setExercises([{ ...emptyExercise }])
    setLinks([''])
    setExistingImages([])
    setNewImageFiles([])
  }

  function updateExercise(i, field, value) {
    setExercises(exercises.map((ex, idx) => (idx === i ? { ...ex, [field]: value } : ex)))
  }

  async function uploadImages() {
    const urls = []
    for (const file of newImageFiles) {
      const ext = file.name.split('.').pop()
      const path = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const { error } = await supabase.storage.from('traeningsbilleder').upload(path, file)
      if (error) throw new Error('Billedupload fejlede: ' + error.message)
      const { data } = supabase.storage.from('traeningsbilleder').getPublicUrl(path)
      urls.push(data.publicUrl)
    }
    return urls
  }

  async function addTraining() {
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
      const cleanLinks = links.map((l) => l.trim()).filter(Boolean)
        .map((l) => (l.startsWith('http') ? l : 'https://' + l))

      const uploadedUrls = await uploadImages()
      const allImages = [...existingImages, ...uploadedUrls]

      const { error } = await supabase.from('trainings').insert({
        team_name: teamName.trim(),
        date,
        time: hour !== '' ? `${hour}:${minute}` : null,
        place: place.trim(),
        theme: theme.trim(),
        exercises: cleanExercises,
        links: cleanLinks,
        images: allImages,
        created_by: session.user.id,
        created_by_name: authorName,
      })
      if (error) throw new Error(error.message)
      resetForm()
      setShowForm(false)
      load()
    } catch (e) {
      alert('Kunne ikke gemme træningen: ' + e.message)
    }
    setSaving(false)
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
          <p className="page-sub">Planlæg træninger med øvelser, billeder og links. Klik på en træning for at se detaljer.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { if (showForm) resetForm(); setShowForm(!showForm) }}>
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
                <button className="btn btn-ghost btn-small" onClick={() => setExercises(exercises.filter((_, idx) => idx !== i))} title="Fjern øvelse">✕</button>
              )}
            </div>
          ))}
          <button className="btn btn-ghost" onClick={() => setExercises([...exercises, { ...emptyExercise }])}>+ Tilføj øvelse</button>

          <h3 className="section-title">Links</h3>
          {links.map((l, i) => (
            <div key={i} className="link-row">
              <input
                value={l}
                onChange={(e) => setLinks(links.map((x, idx) => (idx === i ? e.target.value : x)))}
                placeholder="F.eks. link til en øvelsesvideo (youtube.com/…)"
              />
              {links.length > 1 && (
                <button className="btn btn-ghost btn-small" onClick={() => setLinks(links.filter((_, idx) => idx !== i))} title="Fjern link">✕</button>
              )}
            </div>
          ))}
          <button className="btn btn-ghost" onClick={() => setLinks([...links, ''])}>+ Tilføj link</button>

          <h3 className="section-title">Billeder</h3>
          {existingImages.length > 0 && (
            <div className="image-strip">
              {existingImages.map((url, i) => (
                <div key={i} className="image-thumb">
                  <img src={url} alt={`Billede ${i + 1}`} />
                  <button className="image-remove" onClick={() => setExistingImages(existingImages.filter((_, idx) => idx !== i))} title="Fjern billede">✕</button>
                </div>
              ))}
            </div>
          )}
          <label className="field">
            <span>Tilføj billeder (opstillinger, baneskitser…)</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setNewImageFiles([...newImageFiles, ...Array.from(e.target.files)])}
            />
          </label>
          {newImageFiles.length > 0 && (
            <p className="muted">{newImageFiles.length} nye billede(r) klar til upload: {newImageFiles.map(f => f.name).join(', ')}
              {' '}<button className="btn btn-link" onClick={() => setNewImageFiles([])}>Fortryd</button>
            </p>
          )}

          <div className="form-actions">
            <button className="btn btn-primary" onClick={addTraining} disabled={saving}>
              {saving ? 'Gemmer…' : 'Gem træning'}
            </button>
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
            <li key={t.id} className="card training-card training-card-clickable">
              <Link to={`/traeninger/${t.id}`} className="training-link">
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
                <p className="muted training-summary">
                  {(t.exercises?.length || 0)} øvelse(r)
                  {t.images?.length ? ` · ${t.images.length} billede(r)` : ''}
                  {t.links?.length ? ` · ${t.links.length} link(s)` : ''}
                  {' · Se detaljer →'}
                </p>
              </Link>
              <div className="training-foot">
                <span className="muted">Oprettet af {t.created_by_name}</span>
                <button className="btn btn-ghost btn-small" onClick={() => startCopy(t)}>Kopiér til ny</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
