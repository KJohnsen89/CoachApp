import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import MediaFields, { MediaView, uploadImages, cleanLinks } from '../components/MediaFields'

export default function Home({ session, profile }) {
  const [posts, setPosts] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [links, setLinks] = useState([''])
  const [newImageFiles, setNewImageFiles] = useState([])

  const authorName =
    session.user.user_metadata?.display_name || session.user.email

  async function load() {
    const { data } = await supabase
      .from('posts')
      .select('*, post_views(user_id, user_name)')
      .order('created_at', { ascending: false })
      .limit(30)
    setPosts(data || [])
    setLoading(false)
    // Markér de viste opslag som set af mig (i baggrunden)
    if (data && data.length > 0) {
      const rows = data.map((p) => ({ post_id: p.id, user_id: session.user.id, user_name: authorName }))
      supabase.from('post_views').upsert(rows, { onConflict: 'post_id,user_id' })
    }
  }

  useEffect(() => { load() }, [])

  async function addPost() {
    const body = text.trim()
    if (!body && newImageFiles.length === 0) return
    setSaving(true)
    try {
      const images = await uploadImages(newImageFiles, session.user.id)
      const { error } = await supabase.from('posts').insert({
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
      alert('Kunne ikke slå op: ' + e.message)
    }
    setSaving(false)
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
        <MediaFields
          compact
          links={links} setLinks={setLinks}
          existingImages={[]} setExistingImages={() => {}}
          newImageFiles={newImageFiles} setNewImageFiles={setNewImageFiles}
        />
        <div className="composer-actions">
          <button className="btn btn-primary" onClick={addPost} disabled={saving}>
            {saving ? 'Slår op…' : 'Slå op'}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="muted">Henter opslag…</p>
      ) : posts.length === 0 ? (
        <div className="empty">Ingen opslag endnu. Skriv det første ovenfor.</div>
      ) : (
        <ul className="post-list">
          {posts.map((p) => {
            const viewers = (p.post_views || []).filter((v) => v.user_id !== p.author_id)
            return (
              <li key={p.id} className="card post">
                <div className="post-head">
                  <strong>{p.author_name}</strong>
                  <span className="muted">{new Date(p.created_at).toLocaleString('da-DK', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                {p.body && <p className="post-body">{p.body}</p>}
                <MediaView images={p.images} links={p.links} />
                {viewers.length > 0 && (
                  <p className="muted view-list">👀 Set af: {viewers.map((v) => v.user_name).join(', ')}</p>
                )}
                {(p.author_id === session.user.id || profile?.is_admin) && (
                  <button className="btn btn-ghost btn-small" onClick={() => deletePost(p.id)}>Slet</button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
