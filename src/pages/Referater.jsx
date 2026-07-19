import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import MediaFields, { MediaView, uploadImages, cleanLinks } from '../components/MediaFields'

export default function Referater({ session, profile }) {
  const [referater, setReferater] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [openId, setOpenId] = useState(null)

  const [title, setTitle] = useState('')
  const [meetingDate, setMeetingDate] = useState('')
  const [body, setBody] = useState('')
  const [links, setLinks] = useState([''])
  const [newImageFiles, setNewImageFiles] = useState([])

  const authorName = session.user.user_metadata?.display_name || session.user.email

  async function load() {
    const { data } = await supabase.from('referater').select('*').order('meeting_date', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false })
    setReferater(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function resetForm() {
    setTitle(''); setMeetingDate(''); setBody(''); setLinks(['']); setNewImageFiles([])
  }

  async function addReferat() {
    if (!title.trim() || !body.trim()) {
      alert('Udfyld mindst titel og indhold.')
      return
    }
    setSaving(true)
    try {
      const images = await uploadImages(newImageFiles, session.user.id)
      const { error } = await supabase.from('referater').insert({
        title: title.trim(),
        meeting_date: meetingDate || null,
        body: body.trim(),
        images,
        links: cleanLinks(links),
        created_by: session.user.id,
        created_by_name: authorName,
      })
      if (error) throw new Error(error.message)
      resetForm()
      setShowForm(false)
      load()
    } catch (e) {
      alert('Kunne ikke gemme referatet: ' + e.message)
    }
    setSaving(false)
  }

  async function deleteReferat(id) {
    if (!confirm('Slet dette referat?')) return
    await supabase.from('referater').delete().eq('id', id)
    load()
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Referater</h1>
          <p className="page-sub">Referater fra trænermøder og årgangsmøder.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { if (showForm) resetForm(); setShowForm(!showForm) }}>
          {showForm ? 'Luk' : '+ Nyt referat'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <div className="form-row">
            <label className="field">
              <span>Titel</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="F.eks. Trænermøde august" />
            </label>
            <label className="field">
              <span>Mødedato (valgfri)</span>
              <input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} />
            </label>
          </div>
          <label className="field">
            <span>Indhold</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} placeholder="Referatets tekst…" />
          </label>
          <MediaFields
            links={links} setLinks={setLinks}
            existingImages={[]} setExistingImages={() => {}}
            newImageFiles={newImageFiles} setNewImageFiles={setNewImageFiles}
          />
          <div className="form-actions">
            <button className="btn btn-primary" onClick={addReferat} disabled={saving}>
              {saving ? 'Gemmer…' : 'Gem referat'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="muted">Henter referater…</p>
      ) : referater.length === 0 ? (
        <div className="empty">Ingen referater endnu. Tilføj det første med "+ Nyt referat".</div>
      ) : (
        <ul className="referat-list">
          {referater.map((r) => {
            const isOpen = openId === r.id
            const canDelete = r.created_by === session.user.id || profile?.is_admin
            return (
              <li key={r.id} className="card referat-item">
                <button className="referat-header" onClick={() => setOpenId(isOpen ? null : r.id)}>
                  <div>
                    <h3>{r.title}</h3>
                    <span className="muted">
                      {r.meeting_date ? new Date(r.meeting_date + 'T00:00:00').toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date(r.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}{r.created_by_name}
                    </span>
                  </div>
                  <span className="referat-toggle">{isOpen ? '▲' : '▼'}</span>
                </button>
                {isOpen && (
                  <div className="referat-body">
                    <p className="post-body">{r.body}</p>
                    <MediaView images={r.images} links={r.links} />
                    {canDelete && (
                      <button className="btn btn-ghost btn-small" onClick={() => deleteReferat(r.id)}>Slet</button>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
