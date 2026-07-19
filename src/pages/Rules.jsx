import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const CATEGORIES = ['Træning', 'Trænere', 'Stævner & hold', 'Møder', 'Kultur', 'Andet']

export default function Rules({ session, profile }) {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [body, setBody] = useState('')
  const [filter, setFilter] = useState('Alle')

  const isAdmin = !!profile?.is_admin

  async function load() {
    const { data } = await supabase.from('club_rules').select('*').order('category').order('created_at')
    setRules(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function resetForm() {
    setEditingId(null); setTitle(''); setCategory(CATEGORIES[0]); setBody('')
  }

  function openEdit(r) {
    setEditingId(r.id)
    setTitle(r.title)
    setCategory(r.category || CATEGORIES[0])
    setBody(r.body)
    setShowForm(true)
    window.scrollTo(0, 0)
  }

  async function save() {
    if (!title.trim() || !body.trim()) {
      alert('Udfyld både titel og tekst.')
      return
    }
    const payload = { title: title.trim(), category, body: body.trim(), updated_at: new Date().toISOString() }
    let error
    if (editingId) {
      ;({ error } = await supabase.from('club_rules').update(payload).eq('id', editingId))
    } else {
      ;({ error } = await supabase.from('club_rules').insert({ ...payload, created_by: session.user.id }))
    }
    if (error) {
      alert('Kunne ikke gemme: ' + error.message)
    } else {
      resetForm()
      setShowForm(false)
      load()
    }
  }

  async function deleteRule(id) {
    if (!confirm('Slet denne regel?')) return
    await supabase.from('club_rules').delete().eq('id', id)
    load()
  }

  const categoriesInUse = Array.from(new Set(rules.map((r) => r.category || 'Andet')))
  const shown = filter === 'Alle' ? rules : rules.filter((r) => (r.category || 'Andet') === filter)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Regler & filosofi</h1>
          <p className="page-sub">Det vi er blevet enige om som trænergruppe.</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { if (showForm) resetForm(); setShowForm(!showForm) }}>
            {showForm ? 'Luk' : '+ Tilføj'}
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <div className="card form-card">
          <h3 className="section-title">{editingId ? 'Redigér' : 'Ny regel / aftale'}</h3>
          <div className="form-row">
            <label className="field">
              <span>Titel</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="F.eks. Vagtplan og tilmelding" />
            </label>
            <label className="field">
              <span>Kategori</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>
          <label className="field">
            <span>Tekst</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Beskriv aftalen…" />
          </label>
          <button className="btn btn-primary" onClick={save}>{editingId ? 'Gem ændringer' : 'Gem'}</button>
          {editingId && <button className="btn btn-link" onClick={() => { resetForm(); setShowForm(false) }}>Annullér</button>}
        </div>
      )}

      {rules.length > 0 && (
        <div className="toggle-row rules-filter">
          <button className={`btn btn-toggle ${filter === 'Alle' ? 'active' : ''}`} onClick={() => setFilter('Alle')}>Alle</button>
          {categoriesInUse.map((c) => (
            <button key={c} className={`btn btn-toggle ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>{c}</button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="muted">Henter…</p>
      ) : shown.length === 0 ? (
        <div className="empty">
          {rules.length === 0 ? 'Ingen regler tilføjet endnu.' : 'Ingen regler i denne kategori.'}
        </div>
      ) : (
        <ul className="rule-list">
          {shown.map((r) => (
            <li key={r.id} className="card rule-item">
              <div className="rule-head">
                <h3>{r.title}</h3>
                {r.category && <span className="chip">{r.category}</span>}
              </div>
              <p className="post-body">{r.body}</p>
              {isAdmin && (
                <div className="rule-actions">
                  <button className="btn btn-ghost btn-small" onClick={() => openEdit(r)}>Redigér</button>
                  <button className="btn btn-ghost btn-small" onClick={() => deleteRule(r.id)}>Slet</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
