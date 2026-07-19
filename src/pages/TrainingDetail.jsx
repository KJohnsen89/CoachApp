import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { MediaView } from '../components/MediaFields'

export default function TrainingDetail({ session }) {
  const { trainingId } = useParams()
  const [training, setTraining] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const myName = session.user.user_metadata?.display_name || session.user.email

  async function load() {
    const [t, a] = await Promise.all([
      supabase.from('trainings').select('*').eq('id', trainingId).single(),
      supabase.from('training_attendance').select('*').eq('training_id', trainingId),
    ])
    setTraining(t.data)
    setAttendance(a.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [trainingId])

  async function setMyStatus(status) {
    const mine = attendance.find((a) => a.user_id === session.user.id)
    // Klik på samme status igen = fjern min tilmelding
    if (mine && mine.status === status) {
      await supabase.from('training_attendance').delete()
        .eq('training_id', trainingId).eq('user_id', session.user.id)
    } else {
      await supabase.from('training_attendance').upsert({
        training_id: trainingId,
        user_id: session.user.id,
        user_name: myName,
        status,
        updated_at: new Date().toISOString(),
      })
    }
    load()
  }

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
  const myStatus = attendance.find((a) => a.user_id === session.user.id)?.status
  const coming = attendance.filter((a) => a.status === 'kommer')
  const notComing = attendance.filter((a) => a.status === 'kommer_ikke')

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
        {training.series_id && <p className="muted">🔁 Del af en træningsserie</p>}

        {/* Deltagelse */}
        <div className="attendance-box">
          <h3 className="section-title">Deltager du?</h3>
          <div className="attendance-buttons">
            <button
              className={`btn ${myStatus === 'kommer' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setMyStatus('kommer')}
            >✓ Jeg deltager</button>
            <button
              className={`btn ${myStatus === 'kommer_ikke' ? 'btn-danger' : 'btn-ghost'}`}
              onClick={() => setMyStatus('kommer_ikke')}
            >✕ Jeg kommer ikke</button>
          </div>
          <div className="attendance-lists">
            <div>
              <span className="attend-label attend-yes">Kommer ({coming.length})</span>
              {coming.length > 0
                ? <p className="muted">{coming.map((a) => a.user_name).join(', ')}</p>
                : <p className="muted">Ingen tilmeldt endnu.</p>}
            </div>
            {notComing.length > 0 && (
              <div>
                <span className="attend-label attend-no">Kommer ikke ({notComing.length})</span>
                <p className="muted">{notComing.map((a) => a.user_name).join(', ')}</p>
              </div>
            )}
          </div>
        </div>

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

        {(training.links?.length > 0 || training.images?.length > 0) && (
          <>
            <h3 className="section-title">Links & billeder</h3>
            <MediaView images={training.images} links={training.links} />
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
