import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const emptyExercise = { name: '', minutes: '', description: '' }

// Genbrugelig øvelses-editor til trænings-formularer (opret + redigér).
// Lader trænere vælge fra øvelsesbanken, og gemme en øvelse til banken.
export default function ExerciseEditor({ exercises, setExercises, userId, userName }) {
  const [categories, setCategories] = useState([])
  const [bankExercises, setBankExercises] = useState([])
  const [pickValue, setPickValue] = useState('')
  const [saveOpenIndex, setSaveOpenIndex] = useState(null)
  const [saveCategory, setSaveCategory] = useState('')
  const [saveMsg, setSaveMsg] = useState('')

  async function loadBank() {
    const [cat, ex] = await Promise.all([
      supabase.from('exercise_categories').select('*').order('name'),
      supabase.from('exercise_bank').select('*').order('name'),
    ])
    setCategories(cat.data || [])
    setBankExercises(ex.data || [])
  }
  useEffect(() => { loadBank() }, [])

  function updateExercise(i, field, value) {
    setExercises(exercises.map((ex, idx) => (idx === i ? { ...ex, [field]: value } : ex)))
  }

  function addBlankRow() {
    setExercises([...exercises, { ...emptyExercise }])
  }

  function removeRow(i) {
    setExercises(exercises.filter((_, idx) => idx !== i))
  }

  function addFromBank(exerciseId) {
    const ex = bankExercises.find((b) => b.id === exerciseId)
    if (!ex) return
    setExercises([...exercises, { name: ex.name, minutes: ex.minutes ?? '', description: ex.description || '' }])
    setPickValue('')
  }

  async function saveRowToBank(i) {
    const ex = exercises[i]
    if (!String(ex.name).trim()) return
    const { error } = await supabase.from('exercise_bank').insert({
      name: String(ex.name).trim(),
      minutes: ex.minutes ? Number(ex.minutes) : null,
      description: String(ex.description || '').trim(),
      category_id: saveCategory || null,
      created_by: userId,
      created_by_name: userName,
    })
    if (error) {
      setSaveMsg('Kunne ikke gemme: ' + error.message)
    } else {
      setSaveMsg('Gemt i øvelsesbanken ✓')
      setSaveOpenIndex(null)
      setSaveCategory('')
      loadBank()
      setTimeout(() => setSaveMsg(''), 2500)
    }
  }

  const uncategorized = bankExercises.filter((e) => !e.category_id)
  const byCategory = categories
    .map((c) => ({ category: c, items: bankExercises.filter((e) => e.category_id === c.id) }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="exercise-editor">
      {bankExercises.length > 0 && (
        <label className="field bank-picker">
          <span>Tilføj fra øvelsesbanken</span>
          <select value={pickValue} onChange={(e) => { if (e.target.value) addFromBank(e.target.value) }}>
            <option value="">Vælg en øvelse…</option>
            {byCategory.map((g) => (
              <optgroup key={g.category.id} label={g.category.name}>
                {g.items.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </optgroup>
            ))}
            {uncategorized.length > 0 && (
              <optgroup label="Ukategoriseret">
                {uncategorized.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </optgroup>
            )}
          </select>
        </label>
      )}

      {exercises.map((ex, i) => (
        <div key={i} className="exercise-editor-row">
          <div className="exercise-row">
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
            <button
              className="btn btn-icon"
              onClick={() => setSaveOpenIndex(saveOpenIndex === i ? null : i)}
              title="Gem i øvelsesbanken"
            >💾</button>
            {exercises.length > 1 && (
              <button className="btn btn-ghost btn-small" onClick={() => removeRow(i)} title="Fjern øvelse">✕</button>
            )}
          </div>
          {saveOpenIndex === i && (
            <div className="bank-save-inline">
              <select value={saveCategory} onChange={(e) => setSaveCategory(e.target.value)}>
                <option value="">Ingen kategori</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button className="btn btn-primary btn-small" onClick={() => saveRowToBank(i)}>Gem i bank</button>
              <button className="btn btn-link" onClick={() => setSaveOpenIndex(null)}>Annullér</button>
            </div>
          )}
        </div>
      ))}
      {saveMsg && <p className="msg msg-info">{saveMsg}</p>}
      <button className="btn btn-ghost" onClick={addBlankRow}>+ Tilføj øvelse</button>
    </div>
  )
}
