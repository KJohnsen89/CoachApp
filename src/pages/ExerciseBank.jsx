import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ExerciseBank({ session }) {
  const [categories, setCategories] = useState([])
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Alle')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [minutes, setMinutes] = useState('')
  const [description, setDescription] = useState('')

  const [newCategory, setNewCategory] = useState('')

  const userName = session.user.user_metadata?.display_name || session.user.email

  async function load() {
    const [cat, ex] = await Promise.all([
      supabase.from('exercise_categories').select('*').order('name'),
      supabase.from('exercise_bank').select('*').order('name'),
    ])
    setCategories(cat.data || [])
    setExercises(ex.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function resetForm() {
    setEditingId(null); setName(''); setCategoryId(''); setMinutes(''); setDescription('')
  }

  function openEdit(ex) {
    setEditingId(ex.id)
    setName(ex.name)
    setCategoryId(ex.category_id || '')
    setMinutes(ex.minutes ?? '')
    setDescription(ex.description || '')
    setShowForm(true)
    window.scrollTo(0, 0)
  }

  async function saveExercise() {
    if (!name.trim()) return
    const payload = {
      name: name.trim(),
      category_id: categoryId || null,
      minutes: minutes ? Number(minutes) : null,
      description: description.trim(),
    }
    let error
    if (editingId) {
      ;({ error } = await supabase.from('exercise_bank').update(payload).eq('id', editingId))
    } else {
      ;({ error } = await supabase.from('exercise_bank').insert({
        ...payload, created_by: session.user.id, created_by_name: userName,
      }))
    }
    if (error) {
      alert('Kunne ikke gemme: ' + error.message)
    } else {
      resetForm()
      setShowForm(false)
      load()
    }
  }

  async function deleteExercise(id) {
    if (!confirm('Slet denne øvelse fra banken?')) return
    await supabase.from('exercise_bank').delete().eq('id', id)
    load()
  }

  async function addCategory() {
    const nm = newCategory.trim()
    if (!nm) return
    const { error } = await supabase.from('exercise_categories').insert({
      name: nm, created_by: session.user.id,
    })
    if (error) {
      alert('Kunne ikke oprette kategori: ' + error.message)
    } else {
      setNewCategory('')
      load()
    }
  }

  async function deleteCategory(cat) {
    if (!confirm(`Slet kategorien "${cat.name}"? Øvelser i den bliver ikke slettet, men mister kategorien.`)) return
    await supabase.from('exercise_categories').delete().eq('id', cat.id)
    load()
  }

  const categoryName = (id) => categories.find((c) => c.id === id)?.name || 'Ukategoriseret'
  const shown = filter === 'Alle' ? exercises : exercises.filter((e) => categoryName(e.category_id) === filter)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Øvelsesbank</h1>
          <p className="page-sub">Gem og genbrug øvelser, i stedet for at finde på dem fra bunden hver gang.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { if (showForm) resetForm(); setShowForm(!showForm) }}>
          {showForm ? 'Luk' : '+ Ny øvelse'}
        </button>
      </div>

      <div className="card form-card bank-categories-card">
        <h3 className="section-title">Kategorier</h3>
        <div className="position-picker">
          {categories.map((c) => (
            <span key={c.id} className="pos-chip category-chip">
              {c.name}
              <button className="category-chip-remove" onClick={() => deleteCategory(c)} title="Slet kategori">✕</button>
            </span>
          ))}
        </div>
        <div className="link-row" style={{ marginTop: '0.6rem' }}>
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Ny kategori, f.eks. Afslutninger"
            onKeyDown={(e) => e.key === 'Enter' && addCategory()}
          />
          <button className="btn btn-ghost btn-small" onClick={addCategory}>+ Tilføj</button>
        </div>
      </div>

      {showForm && (
        <div className="card form-card">
          <h3 className="section-title">{editingId ? 'Redigér øvelse' : 'Ny øvelse'}</h3>
          <div className="form-row">
            <label className="field">
              <span>Navn</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="F.eks. Firkant-leg" />
            </label>
            <label className="field">
              <span>Kategori</span>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Ingen kategori</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Varighed (min.)</span>
              <input type="number" min="0" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            </label>
          </div>
          <label className="field">
            <span>Beskrivelse</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Opstilling, fokuspunkter…" />
          </label>
          <button className="btn btn-primary" onClick={saveExercise}>{editingId ? 'Gem ændringer' : 'Gem øvelse'}</button>
          {editingId && <button className="btn btn-link" onClick={() => { resetForm(); setShowForm(false) }}>Annullér</button>}
        </div>
      )}

      {categories.length > 0 && (
        <div className="toggle-row rules-filter">
          <button className={`btn btn-toggle ${filter === 'Alle' ? 'active' : ''}`} onClick={() => setFilter('Alle')}>Alle</button>
          {categories.map((c) => (
            <button key={c.id} className={`btn btn-toggle ${filter === c.name ? 'active' : ''}`} onClick={() => setFilter(c.name)}>{c.name}</button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="muted">Henter øvelsesbank…</p>
      ) : shown.length === 0 ? (
        <div className="empty">Ingen øvelser her endnu. Tilføj den første med "+ Ny øvelse".</div>
      ) : (
        <ul className="rule-list">
          {shown.map((e) => (
            <li key={e.id} className="card rule-item">
              <div className="rule-head">
                <h3>{e.name}</h3>
                <span className="chip">{categoryName(e.category_id)}{e.minutes ? ` · ${e.minutes} min` : ''}</span>
              </div>
              {e.description && <p className="post-body">{e.description}</p>}
              <div className="rule-actions">
                <button className="btn btn-ghost btn-small" onClick={() => openEdit(e)}>Redigér</button>
                <button className="btn btn-ghost btn-small" onClick={() => deleteExercise(e.id)}>Slet</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
