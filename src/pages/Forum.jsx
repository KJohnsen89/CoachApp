import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import MediaFields, { uploadImages, cleanLinks } from '../components/MediaFields'

export default function Forum({ session }) {
  const [threads, setThreads] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [links, setLinks] = useState([''])
  const [newImageFiles, setNewImageFiles] = useState([])
  const [notify, setNotify] = useState(true)

  const authorName =
    session.user.user_metadata?.display_name || session.user.email

  async function load() {
    const { data } = await supabase
      .from('forum_threads')
      .select('*, forum_replies(count)')
      .order('created_at', { ascending: false })
    setThreads(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addThread() {
    if (!title.trim()) return
    setSaving(true)
    try {
      const images = await uploadImages(newImageFiles, session.user.id)
      const { error } = await supabase.from('forum_threads').insert({
        title: title.trim(),
        body: body.trim(),
        author_name: authorName,
        author_id: session.user.id,
        images,
        links: cleanLinks(links),
        notify,
      })
      if (error) throw new Error(error.message)
      setTitle(''); setBody(''); setLinks(['']); setNewImageFiles([]); setNotify(true)
      setShowForm(false)
      load()
    } catch (e) {
      alert('Kunne ikke oprette diskussionen: ' + e.message)
    }
    setSaving(false)
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Forum</h1>
          <p className="page-sub">Diskussioner mellem trænerne — øvelser, kampe, planlægning.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Luk' : '+ Ny diskussion'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <label className="field">
            <span>Overskrift</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Hvad vil du diskutere?" />
          </label>
          <label className="field">
            <span>Beskrivelse</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Uddyb dit spørgsmål eller emne…" />
          </label>
          <MediaFields
            links={links} setLinks={setLinks}
            existingImages={[]} setExistingImages={() => {}}
            newImageFiles={newImageFiles} setNewImageFiles={setNewImageFiles}
          />
          <label className="check-row check-row-small">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
            <span>Send e-mail-notifikation til trænere der har slået det til</span>
          </label>
          <button className="btn btn-primary" onClick={addThread} disabled={saving}>
            {saving ? 'Opretter…' : 'Opret diskussion'}
          </button>
        </div>
      )}

      {loading ? (
        <p className="muted">Henter diskussioner…</p>
      ) : threads.length === 0 ? (
        <div className="empty">Ingen diskussioner endnu. Start den første!</div>
      ) : (
        <ul className="thread-list">
          {threads.map((t) => {
            const replyCount = t.forum_replies?.[0]?.count ?? 0
            return (
              <li key={t.id} className="card thread-item">
                <Link to={`/forum/${t.id}`} className="thread-link">
                  <h3>{t.title}</h3>
                  <div className="thread-meta">
                    <span>{t.author_name}</span>
                    <span>·</span>
                    <span>{new Date(t.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}</span>
                    <span>·</span>
                    <span>{replyCount} svar</span>
                    {t.images?.length ? <><span>·</span><span>📷 {t.images.length}</span></> : null}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
