import { supabase } from '../supabaseClient'

// Genbrugelig hjælpefunktion: upload billeder til Supabase Storage
export async function uploadImages(files, userId) {
  const urls = []
  for (const file of files) {
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error } = await supabase.storage.from('traeningsbilleder').upload(path, file)
    if (error) throw new Error('Billedupload fejlede: ' + error.message)
    const { data } = supabase.storage.from('traeningsbilleder').getPublicUrl(path)
    urls.push(data.publicUrl)
  }
  return urls
}

// Normalisér links (tilføj https:// hvis det mangler)
export function cleanLinks(links) {
  return links
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => (l.startsWith('http') ? l : 'https://' + l))
}

// UI til at tilføje links, eksisterende billeder og nye billed-filer.
// Bruges i opslag, forum og træning.
export default function MediaFields({
  links, setLinks,
  existingImages, setExistingImages,
  newImageFiles, setNewImageFiles,
  compact = false,
}) {
  return (
    <div className={compact ? 'media-fields compact' : 'media-fields'}>
      <div className="media-block">
        <span className="media-label">Links</span>
        {links.map((l, i) => (
          <div key={i} className="link-row">
            <input
              value={l}
              onChange={(e) => setLinks(links.map((x, idx) => (idx === i ? e.target.value : x)))}
              placeholder="F.eks. youtube.com/… eller et dokument"
            />
            {links.length > 1 && (
              <button className="btn btn-ghost btn-small" onClick={() => setLinks(links.filter((_, idx) => idx !== i))} title="Fjern link">✕</button>
            )}
          </div>
        ))}
        <button className="btn btn-ghost btn-small" onClick={() => setLinks([...links, ''])}>+ Tilføj link</button>
      </div>

      <div className="media-block">
        <span className="media-label">Billeder</span>
        {existingImages.length > 0 && (
          <div className="image-strip">
            {existingImages.map((url, i) => (
              <div key={i} className="image-thumb">
                <img src={url} alt={`Billede ${i + 1}`} />
                <button className="image-remove" onClick={() => setExistingImages(existingImages.filter((_, idx) => idx !== i))} title="Fjern billede">✕</button>
              </div>
            ))}
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => { setNewImageFiles([...newImageFiles, ...Array.from(e.target.files)]); e.target.value = '' }}
        />
        {newImageFiles.length > 0 && (
          <p className="muted">{newImageFiles.length} nyt billede(r) klar: {newImageFiles.map(f => f.name).join(', ')}
            {' '}<button className="btn btn-link" onClick={() => setNewImageFiles([])}>Fortryd</button>
          </p>
        )}
      </div>
    </div>
  )
}

// Genbrugelig visning af billeder + links (til lister og detaljer)
export function MediaView({ images, links }) {
  const hasImages = images?.length > 0
  const hasLinks = links?.length > 0
  if (!hasImages && !hasLinks) return null
  return (
    <div className="media-view">
      {hasLinks && (
        <ul className="detail-links">
          {links.map((l, i) => (
            <li key={i}><a href={l} target="_blank" rel="noopener noreferrer">{l}</a></li>
          ))}
        </ul>
      )}
      {hasImages && (
        <div className="image-gallery">
          {images.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
              <img src={url} alt={`Billede ${i + 1}`} />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
