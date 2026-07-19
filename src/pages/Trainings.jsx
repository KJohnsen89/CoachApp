import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import MediaFields, { uploadImages, cleanLinks } from '../components/MediaFields'

const emptyExercise = { name: '', minutes: '', description: '' }
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']
const WEEKDAYS = [
  { value: 1, label: 'Mandag' },
  { value: 2, label: 'Tirsdag' },
  { value: 3, label: 'Onsdag' },
  { value: 4, label: 'Torsdag' },
  { value: 5, label: 'Fredag' },
  { value: 6, label: 'Lørdag' },
  { value: 0, label: 'Søndag' },
]

// Generér datoer: start fra 'date', gentag hver uge på samme ugedag, 'count' gange
function buildSeriesDates(startDate, count) {
  const dates = []
  const d = new Date(startDate + 'T00:00:00')
  for (let i = 0; i < count; i++) {
    dates.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() + 7)
  }
  return dates
}

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
  const [existingImages, setExistingImages] = useState([])
  const [newImageFiles, setNewImageFiles] = useState([])
  const [notify, setNotify] = useState(true)

  // serie
  const [isSeries, setIsSeries] = useState(false)
  const [seriesCount, setSeriesCount] = useState(4)

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

  useEffect(() => {
    const copy = location.state?.copyFrom
    if (copy) {
      fillForm(copy)
      setShowForm(true)
      navigate('.', { replace: true, state: {} })
      window.scrollTo(0, 0)
    }
  }, [location.state])

  function fillForm(t) {
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
    setIsSeries(false)
    setSeriesCount(4)
  }

  function startCopy(t) {
    fillForm(t)
    setShowForm(true)
    window.scrollTo(0, 0)
  }

  function resetForm() {
    setTeamName(''); setDate(''); setHour(''); setMinute('00')
    setPlace(''); setTheme('')
    setExercises([{ ...emptyExercise }])
    setLinks(['']); setExistingImages([]); setNewImageFiles([])
    setIsSeries(false); setSeriesCount(4)
    setNotify(true)
  }

  function updateExercise(i, field, value) {
    setExercises(exercises.map((ex, idx) => (idx === i ? { ...ex, [field]: value } : ex)))
  }

  async function addTraining() {
    if (!date || !teamName.trim()) {
      alert('Vælg mindst en dato og et hold.')
      return
    }
    if (isSeries && (seriesCount < 1 || seriesCount > 52)) {
      alert('Antal træninger i serien skal være mellem 1 og 52.')
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

      const dates = isSeries ? buildSeriesDates(date, Number(seriesCount)) : [date]
      const seriesId = isSeries ? crypto.randomUUID() : null

      const rows = dates.map((d) => ({
        team_name: teamName.trim(),
        date: d,
        time,
        place: place.trim(),
        theme: theme.trim(),
        exercises: cleanExercises,
        links: cleanLinks(links),
        images: allImages,
        series_id: seriesId,
        notify,
        created_by: session.user.id,
        created_by_name: authorName,
      }))

      const { error } = await supabase.from('trainings').insert(rows)
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

  // forhåndsvis seriedatoer
  const previewDates = isSeries && date ? buildSeriesDates(date, Number(seriesCount) || 0) : []

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Træninger</h1>
          <p className="page-sub">Planlæg træninger med øvelser, billeder og links. Klik på en træning for detaljer og deltagelse.</p>
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
              <span>{isSeries ? 'Startdato' : 'Dato'}</span>
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

          {/* Serie */}
          <div className="series-box">
            <label className="check-row">
              <input type="checkbox" checked={isSeries} onChange={(e) => setIsSeries(e.target.checked)} />
              <span>Gentag som serie (samme ugedag hver uge)</span>
            </label>
            {isSeries && (
              <div className="series-details">
                <label className="field">
                  <span>Antal træninger</span>
                  <input
                    type="number" min="1" max="52"
                    value={seriesCount}
                    onChange={(e) => setSeriesCount(e.target.value)}
                    style={{ maxWidth: '120px' }}
                  />
                </label>
                {previewDates.length > 0 && (
                  <p className="muted">
                    Opretter {previewDates.length} træninger:{' '}
                    {previewDates.slice(0, 3).map((d) =>
                      new Date(d + 'T00:00:00').toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
                    ).join(', ')}
                    {previewDates.length > 3 ? ` … frem til ${new Date(previewDates[previewDates.length - 1] + 'T00:00:00').toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}` : ''}
                  </p>
                )}
                <p className="muted">Serien følger den ugedag, din startdato falder på. Vil du fx have hver mandag, så vælg en mandag som startdato.</p>
              </div>
            )}
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
                type="number" min="0"
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

          <h3 className="section-title">Links & billeder</h3>
          <MediaFields
            links={links} setLinks={setLinks}
            existingImages={existingImages} setExistingImages={setExistingImages}
            newImageFiles={newImageFiles} setNewImageFiles={setNewImageFiles}
          />

          <label className="check-row check-row-small">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
            <span>Send e-mail-notifikation til trænere der har slået det til</span>
          </label>

          <div className="form-actions">
            <button className="btn btn-primary" onClick={addTraining} disabled={saving}>
              {saving ? 'Gemmer…' : (isSeries ? `Gem ${previewDates.length || ''} træninger` : 'Gem træning')}
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
                  {t.series_id ? ' · 🔁 serie' : ''}
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
