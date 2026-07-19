import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Thread({ session }) {
  const { threadId } = useParams()
  const [thread, setThread] = useState(null)
  const [replies, setReplies] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)

  const authorName =
    session.user.user_metadata?.display_name || session.user.email

  async function load() {
    const [t, r] = await Promise.all([
      supabase.from('forum_threads').select('*').eq('id', threadId).single(),
      supabase.from('forum_replies').select('*').eq('thread_id', threadId).order('created_at', { ascending: true }),
    ])
    setThread(t.data)
    setReplies(r.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [threadId])

  async function addReply() {
    const body = text.trim()
    if (!body) return
    const { error } = await supabase.from('forum_replies').insert({
      thread_id: threadId,
      body,
      author_name: authorName,
      author_id: session.user.id,
    })
    if (!error) {
      setText('')
      load()
    }
  }

  async function deleteReply(id) {
    if (!confirm('Slet dette svar?')) return
    await supabase.from('forum_replies').delete().eq('id', id)
    load()
  }

  if (loading) return <div className="page"><p className="muted">Henter diskussion…</p></div>
  if (!thread) return <div className="page"><p>Diskussionen findes ikke. <Link to="/forum">Tilbage til forum</Link></p></div>

  return (
    <div className="page">
      <Link to="/forum" className="back-link">← Tilbage til forum</Link>

      <div className="card thread-original">
        <h1 className="page-title">{thread.title}</h1>
        <div className="thread-meta">
          <span>{thread.author_name}</span>
          <span>·</span>
          <span>{new Date(thread.created_at).toLocaleString('da-DK', { dateStyle: 'medium', timeStyle: 'short' })}</span>
        </div>
        {thread.body && <p className="post-body">{thread.body}</p>}
      </div>

      <h3 className="section-title">{replies.length} {replies.length === 1 ? 'svar' : 'svar'}</h3>

      <ul className="reply-list">
        {replies.map((r) => (
          <li key={r.id} className="card reply">
            <div className="post-head">
              <strong>{r.author_name}</strong>
              <span className="muted">{new Date(r.created_at).toLocaleString('da-DK', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
            <p className="post-body">{r.body}</p>
            {r.author_id === session.user.id && (
              <button className="btn btn-ghost btn-small" onClick={() => deleteReply(r.id)}>Slet</button>
            )}
          </li>
        ))}
      </ul>

      <div className="card composer">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Skriv dit svar…"
          rows={3}
        />
        <div className="composer-actions">
          <button className="btn btn-primary" onClick={addReply}>Svar</button>
        </div>
      </div>
    </div>
  )
}
