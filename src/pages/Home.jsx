import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Home({ session }) {
  const [posts, setPosts] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)

  const authorName =
    session.user.user_metadata?.display_name || session.user.email

  async function load() {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)
    setPosts(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addPost() {
    const body = text.trim()
    if (!body) return
    const { error } = await supabase.from('posts').insert({
      body,
      author_name: authorName,
      author_id: session.user.id,
    })
    if (!error) {
      setText('')
      load()
    }
  }

  async function deletePost(id) {
    if (!confirm('Slet dette opslag?')) return
    await supabase.from('posts').delete().eq('id', id)
    load()
  }

  return (
    <div className="page">
      <h1 className="page-title">Opslag</h1>
      <p className="page-sub">Korte beskeder til alle trænere — aflysninger, praktisk info, ros.</p>

      <div className="card composer">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Skriv et opslag til de andre trænere…"
          rows={3}
        />
        <div className="composer-actions">
          <button className="btn btn-primary" onClick={addPost}>Slå op</button>
        </div>
      </div>

      {loading ? (
        <p className="muted">Henter opslag…</p>
      ) : posts.length === 0 ? (
        <div className="empty">Ingen opslag endnu. Skriv det første ovenfor.</div>
      ) : (
        <ul className="post-list">
          {posts.map((p) => (
            <li key={p.id} className="card post">
              <div className="post-head">
                <strong>{p.author_name}</strong>
                <span className="muted">{new Date(p.created_at).toLocaleString('da-DK', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
              <p className="post-body">{p.body}</p>
              {p.author_id === session.user.id && (
                <button className="btn btn-ghost btn-small" onClick={() => deletePost(p.id)}>Slet</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
