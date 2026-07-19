import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import MediaFields, { MediaView, uploadImages, cleanLinks } from '../components/MediaFields'

export default function Thread({ session, profile }) {
  const { threadId } = useParams()
  const [thread, setThread] = useState(null)
  const [replies, setReplies] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const [links, setLinks] = useState([''])
  const [newImageFiles, setNewImageFiles] = useState([])

  const authorName =
    session.user.user_metadata?.display_name || session.user.email

  async function load() {
    const [t, r] = await Promise.all([
      supabase.from('forum_threads').select('*, thread_views(user_id, user_name)').eq('id', threadId).single(),
      supabase.from('forum_replies').select('*').eq('thread_id', threadId).order('created_at', { ascending: true }),
    ])
    setThread(t.data)
    setReplies(r.data || [])
    setLoading(false)
    if (t.data) {
      supabase.from('thread_views').upsert(
        { thread_id: threadId, user_id: session.user.id, user_name: authorName },
        { onConflict: 'thread_id,user_id' }
      )
    }
  }

  useEffect(() => { load() }, [threadId])

  async function addReply() {
    const body = text.trim()
    if (!body && newImageFiles.length === 0) return
    setSaving(true)
    try {
      const images = await uploadImages(newImageFiles, session.user.id)
      const { error } = await supabase.from('forum_replies').insert({
        thread_id: threadId,
        body,
        author_name: authorName,
        author_id: session.user.id,
        images,
        links: cleanLinks(links),
      })
      if (error) throw new Error(error.message)
      setText(''); setLinks(['']); setNewImageFiles([])
      load()
    } catch (e) {
      alert('Kunne ikke svare: ' + e.message)
    }
    setSaving(false)
  }

  async function deleteReply(id) {
    if (!confirm('Slet dette svar?')) return
    await supabase.from('forum_replies').delete().eq('id', id)
    load()
  }

  async function deleteThread() {
    if (!confirm('Slet hele diskussionen inklusive alle svar?')) return
    await supabase.from('forum_threads').delete().eq('id', threadId)
    navigate('/forum')
  }

  if (loading) return <div className="page"><p className="muted">Henter diskussion…</p></div>
  if (!thread) return <div className="page"><p>Diskussionen findes ikke. <Link to="/forum">Tilbage til forum</Link></p></div>

  const viewers = (thread.thread_views || []).filter((v) => v.user_id !== thread.author_id)
  const canDeleteThread = thread.author_id === session.user.id || profile?.is_admin

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
        <MediaView images={thread.images} links={thread.links} />
        {viewers.length > 0 && (
          <p className="muted view-list">👀 Set af: {viewers.map((v) => v.user_name).join(', ')}</p>
        )}
        {canDeleteThread && (
          <button className="btn btn-ghost btn-small" onClick={deleteThread}>Slet diskussion</button>
        )}
      </div>

      <h3 className="section-title">{replies.length} svar</h3>

      <ul className="reply-list">
        {replies.map((r) => (
          <li key={r.id} className="card reply">
            <div className="post-head">
              <strong>{r.author_name}</strong>
              <span className="muted">{new Date(r.created_at).toLocaleString('da-DK', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
            {r.body && <p className="post-body">{r.body}</p>}
            <MediaView images={r.images} links={r.links} />
            {(r.author_id === session.user.id || profile?.is_admin) && (
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
        <MediaFields
          compact
          links={links} setLinks={setLinks}
          existingImages={[]} setExistingImages={() => {}}
          newImageFiles={newImageFiles} setNewImageFiles={setNewImageFiles}
        />
        <div className="composer-actions">
          <button className="btn btn-primary" onClick={addReply} disabled={saving}>
            {saving ? 'Sender…' : 'Svar'}
          </button>
        </div>
      </div>
    </div>
  )
}
