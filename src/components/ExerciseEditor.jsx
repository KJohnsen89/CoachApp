import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { uploadImages, cleanLinks } from './MediaFields'

const emptyExercise = { name: '', minutes: '', description: '', images: [], links: [] }

// Genbrugelig øvelses-editor til trænings-formularer (opret + redigér).
// Lader trænere vælge fra øvelsesbanken, gemme en øvelse til banken,
// og tilføje billeder/links til den enkelte øvelse.
export default function ExerciseEditor({ exercises, setExercises, userId, userName }) {
  const [categories, setCategories] = useState([])
  const [bankExercises, setBankExercises] = useState([])
  const [pickValue, setPickValue] = useState('')
  const [saveOpenIndex, setSaveOpenIndex] = useState(null)
  const [saveCategory, setSaveCategory] = useState('')
  const [saveMsg, setSaveMsg] = useState('')
  const [mediaOpenIndex, setMediaOpenIndex] = useState(null)
  const [uploadingIndex, setUploadingIndex] = useState(null)
  const [linkDraft, setLinkDraft] = useState('')

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
    setExercises([...exercises, {
      name: ex.name,
      minutes: ex.minutes ?? '',
      description: ex.description || '',
      images: ex.images || [],
      links: ex.links || [],
    }])
    setPickValue('')
  }

  async function saveRowToBank(i) {
    const ex = exercises[i]
    if (!String(ex.name).trim()) return
    const { error } = await supabase.from('exercise_bank').insert({
      name: String(ex.name).trim(),
      minutes: ex.minutes ? Number(ex.minutes) : null,
      description: String(ex.description || '').trim(),
      images: ex.images || [],
      links: ex.links || [],
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

  function toggleMedia(i) {
    setMediaOpenIndex(mediaOpenIndex === i ? null : i)
    setLinkDraft('')
  }

  async function addImageToRow(i, file) {
    setUploadingIndex(i)
    try {
      const [url] = await uploadImages([file], userId)
      const ex = exercises[i]
      updateExercise(i, 'images', [...(ex.images || []), url])
    } catch (e) {
      alert('Kunne ikke uploade billedet: ' + e.message)
    }
    setUploadingIndex(null)
  }

  function removeImageFromRow(i, url) {
    const ex = exercises[i]
    updateExercise(i, 'images', (ex.images || []).filter((u) => u !== url))
  }

  function addLinkToRow(i) {
    const url = linkDraft.trim()
    if (!url) return
    const ex = exercises[i]
    updateExercise(i, 'links', [...(ex.links || []), ...cleanLinks([url])])
    setLinkDraft('')
  }

  function removeLinkFromRow(i, url) {
    const ex = exercises[i]
    updateExercise(i, 'links', (ex.links || []).filter((l) => l !== url))
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
              onClick={() => toggleMedia(i)}
              title="Billeder og links til denne øvelse"
            >📎</button>
            <button
              className="btn btn-icon"
              onClick={() => setSaveOpenIndex(saveOpenIndex === i ? null : i)}
              title="Gem i øvelsesbanken"
            >💾</button>
            {exercises.length > 1 && (
              <button className="btn btn-ghost btn-small" onClick={() => removeRow(i)} title="Fjern øvelse">✕</button>
            )}
          </div>

          {mediaOpenIndex !== i && ((ex.images && ex.images.length > 0) || (ex.links && ex.links.length > 0)) && (
            <p className="muted exercise-media-summary">
              {ex.images?.length ? `📷 ${ex.images.length}` : ''}
              {ex.images?.length && ex.links?.length ? ' · ' : ''}
              {ex.links?.length ? `🔗 ${ex.links.length}` : ''}
            </p>
          )}

          {mediaOpenIndex === i && (
            <div className="exercise-media-inline">
              {(ex.images || []).length > 0 && (
                <div className="image-strip">
                  {ex.images.map((url) => (
                    <div key={url} className="image-thumb">
                      <img src={url} alt="Øvelsesbillede" />
                      <button className="image-remove" onClick={() => removeImageFromRow(i, url)} title="Fjern billede">✕</button>
                    </div>
                  ))}
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                disabled={uploadingIndex === i}
                onChange={(e) => {
                  const file = e.target.files[0]
                  if (file) addImageToRow(i, file)
                  e.target.value = ''
                }}
              />
              {uploadingIndex === i && <p className="muted">Uploader…</p>}

              {(ex.links || []).length > 0 && (
                <ul className="detail-links">
                  {ex.links.map((l) => (
                    <li key={l}>
                      <a href={l} target="_blank" rel="noopener noreferrer">{l}</a>
                      {' '}<button className="btn btn-link" onClick={() => removeLinkFromRow(i, l)}>Fjern</button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="link-row">
                <input
                  value={linkDraft}
                  onChange={(e) => setLinkDraft(e.target.value)}
                  placeholder="Link til video eller diagram…"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLinkToRow(i) } }}
                />
                <button className="btn btn-ghost btn-small" onClick={() => addLinkToRow(i)}>+ Tilføj link</button>
              </div>
            </div>
          )}

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
