import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Forum({ session }) {
  const [threads, setThreads] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)

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
    const { error } = await supabase.from('forum_threads').insert({
      title: title.trim(),
      body: body.trim(),
      author_name: authorName,
      author_id: session.user.id,
    })
    if (!error) {
      setTitle(''); setBody('')
      setShowForm(false)
      load()
    }
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
          <button className="btn btn-primary" onClick={addThread}>Opret diskussion</button>
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
                    <span>{replyCount} {replyCount === 1 ? 'svar' : 'svar'}</span>
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
