import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function TrainingDetail({ session }) {
  const { trainingId } = useParams()
  const [training, setTraining] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.from('trainings').select('*').eq('id', trainingId).single()
      .then(({ data }) => { setTraining(data); setLoading(false) })
  }, [trainingId])

  async function deleteTraining() {
    if (!confirm('Slet denne træning?')) return
    await supabase.from('trainings').delete().eq('id', trainingId)
    navigate('/traeninger')
  }

  function copyTraining() {
    navigate('/traeninger', { state: { copyFrom: training } })
  }

  if (loading) return <div className="page"><p className="muted">Henter træning…</p></div>
  if (!training) return <div className="page"><p>Træningen findes ikke. <Link to="/traeninger">Tilbage til træninger</Link></p></div>

  const totalMinutes = (training.exercises || []).reduce((sum, ex) => sum + (Number(ex.minutes) || 0), 0)

  return (
    <div className="page">
      <Link to="/traeninger" className="back-link">← Tilbage til træninger</Link>

      <div className="card training-detail">
        <div className="training-head">
          <div>
            <h1 className="page-title">
              {new Date(training.date + 'T00:00:00').toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h1>
            {training.time && <p className="training-time-big">kl. {training.time.slice(0, 5)}</p>}
          </div>
          <span className="chip">{training.team_name}</span>
        </div>

        {training.theme && <p className="training-theme">{training.theme}</p>}
        {training.place && <p className="muted">📍 {training.place}</p>}

        {training.exercises?.length > 0 && (
          <>
            <h3 className="section-title">
              Øvelser {totalMinutes > 0 && <span className="muted">· i alt {totalMinutes} min</span>}
            </h3>
            <div className="exercise-plan">
              {training.exercises.map((ex, i) => (
                <div key={i} className="exercise-item">
                  <div className="exercise-item-head">
                    <strong>{ex.name}</strong>
                    {ex.minutes && <span className="chip chip-small">{ex.minutes} min</span>}
                  </div>
                  {ex.description && <p className="muted">{ex.description}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        {training.links?.length > 0 && (
          <>
            <h3 className="section-title">Links</h3>
            <ul className="detail-links">
              {training.links.map((l, i) => (
                <li key={i}><a href={l} target="_blank" rel="noopener noreferrer">{l}</a></li>
              ))}
            </ul>
          </>
        )}

        {training.images?.length > 0 && (
          <>
            <h3 className="section-title">Billeder</h3>
            <div className="image-gallery">
              {training.images.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt={`Billede ${i + 1}`} />
                </a>
              ))}
            </div>
          </>
        )}

        <div className="training-foot detail-foot">
          <span className="muted">Oprettet af {training.created_by_name}</span>
          <div className="detail-actions">
            <button className="btn btn-primary" onClick={copyTraining}>Kopiér til ny træning</button>
            {training.created_by === session.user.id && (
              <button className="btn btn-ghost" onClick={deleteTraining}>Slet</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
