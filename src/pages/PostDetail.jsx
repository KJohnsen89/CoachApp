import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { MediaView } from '../components/MediaFields'

export default function PostDetail({ session, profile }) {
  const { postId } = useParams()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const authorName =
    session.user.user_metadata?.display_name || session.user.email

  async function load() {
    const [p, c] = await Promise.all([
      supabase.from('posts').select('*, post_views(user_id, user_name)').eq('id', postId).single(),
      supabase.from('post_comments').select('*').eq('post_id', postId).order('created_at', { ascending: true }),
    ])
    setPost(p.data)
    setComments(c.data || [])
    setLoading(false)
    if (p.data) {
      supabase.from('post_views').upsert(
        { post_id: postId, user_id: session.user.id, user_name: authorName },
        { onConflict: 'post_id,user_id' }
      )
    }
  }

  useEffect(() => { load() }, [postId])

  async function addComment() {
    const body = text.trim()
    if (!body) return
    setSaving(true)
    const { error } = await supabase.from('post_comments').insert({
      post_id: postId,
      body,
      author_id: session.user.id,
      author_name: authorName,
    })
    if (error) {
      alert('Kunne ikke sende kommentaren: ' + error.message)
    } else {
      setText('')
      load()
    }
    setSaving(false)
  }

  async function deleteComment(id) {
    if (!confirm('Slet denne kommentar?')) return
    await supabase.from('post_comments').delete().eq('id', id)
    load()
  }

  async function deletePost() {
    if (!confirm('Slet dette opslag og alle kommentarer til det?')) return
    await supabase.from('posts').delete().eq('id', postId)
    navigate('/')
  }

  if (loading) return <div className="page"><p className="muted">Henter opslag…</p></div>
  if (!post) return <div className="page"><p>Opslaget findes ikke. <Link to="/">Tilbage til opslag</Link></p></div>

  const viewers = (post.post_views || []).filter((v) => v.user_id !== post.author_id)
  const canDelete = post.author_id === session.user.id || profile?.is_admin

  return (
    <div className="page">
      <Link to="/" className="back-link">← Tilbage til opslag</Link>

      <div className="card thread-original">
        <div className="post-head">
          <strong>{post.author_name}</strong>
          <span className="muted">{new Date(post.created_at).toLocaleString('da-DK', { dateStyle: 'medium', timeStyle: 'short' })}</span>
        </div>
        {post.body && <p className="post-body">{post.body}</p>}
        <MediaView images={post.images} links={post.links} />
        {viewers.length > 0 && (
          <p className="muted view-list">👀 Set af: {viewers.map((v) => v.user_name).join(', ')}</p>
        )}
        {canDelete && (
          <button className="btn btn-ghost btn-small" onClick={deletePost}>Slet opslag</button>
        )}
      </div>

      <h3 className="section-title">{comments.length} kommentar{comments.length === 1 ? '' : 'er'}</h3>

      <ul className="reply-list">
        {comments.map((c) => (
          <li key={c.id} className="card reply">
            <div className="post-head">
              <strong>{c.author_name}</strong>
              <span className="muted">{new Date(c.created_at).toLocaleString('da-DK', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
            <p className="post-body">{c.body}</p>
            {(c.author_id === session.user.id || profile?.is_admin) && (
              <button className="btn btn-ghost btn-small" onClick={() => deleteComment(c.id)}>Slet</button>
            )}
          </li>
        ))}
      </ul>

      <div className="card composer">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Skriv en kommentar…"
          rows={3}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addComment() }}
        />
        <div className="composer-actions">
          <button className="btn btn-primary" onClick={addComment} disabled={saving}>
            {saving ? 'Sender…' : 'Kommentér'}
          </button>
        </div>
      </div>
    </div>
  )
}
