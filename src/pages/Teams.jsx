import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const CATEGORIES = ['A', 'B', 'C']
const DEFAULT_POSITIONS = ['Målmand', 'Forsvar', 'Midtbane', 'Angreb']
const SIDE_OPTIONS = [
  { value: 'ikke_aktuelt', label: 'Ikke aktuelt' },
  { value: 'venstre', label: 'Venstre' },
  { value: 'midt', label: 'Midt' },
  { value: 'hojre', label: 'Højre' },
]

function sideLabel(value) {
  return SIDE_OPTIONS.find((o) => o.value === value)?.label || ''
}

export default function Teams({ session }) {
  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  // hold-formular
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [name, setName] = useState('')
  const [ageGroup, setAgeGroup] = useState('')
  const [trainers, setTrainers] = useState('')
  const [notes, setNotes] = useState('')

  // spiller-formular (bruges til både opret og redigér)
  const [showPlayerForm, setShowPlayerForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [pName, setPName] = useState('')
  const [pCategory, setPCategory] = useState('A')
  const [pPositions, setPPositions] = useState([])
  const [pSide, setPSide] = useState('ikke_aktuelt')
  const [pTeam, setPTeam] = useState('')

  const [dragOverTeam, setDragOverTeam] = useState(null)

  async function load() {
    const [tm, pl] = await Promise.all([
      supabase.from('teams').select('*').order('name', { ascending: true }),
      supabase.from('players').select('*').order('name', { ascending: true }),
    ])
    setTeams(tm.data || [])
    setPlayers(pl.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Samling af alle positioner, der er i brug (faste + evt. ældre egne), til forslag
  const allKnownPositions = Array.from(new Set([
    ...DEFAULT_POSITIONS,
    ...players.flatMap((p) => p.positions || []),
  ]))

  async function addTeam() {
    if (!name.trim()) return
    const { error } = await supabase.from('teams').insert({
      name: name.trim(),
      age_group: ageGroup.trim(),
      trainers: trainers.trim(),
      notes: notes.trim(),
      created_by: session.user.id,
    })
    if (!error) {
      setName(''); setAgeGroup(''); setTrainers(''); setNotes('')
      setShowTeamForm(false)
      load()
    }
  }

  async function deleteTeam(team) {
    const count = players.filter((p) => p.team_id === team.id).length
    const msg = count > 0
      ? `Slet holdet "${team.name}"? De ${count} spiller(e) på holdet bliver flyttet til "Uden hold".`
      : `Slet holdet "${team.name}"?`
    if (!confirm(msg)) return
    await supabase.from('teams').delete().eq('id', team.id)
    load()
  }

  function resetPlayerForm() {
    setEditingId(null)
    setPName(''); setPCategory('A'); setPPositions([]); setPSide('ikke_aktuelt'); setPTeam('')
  }

  function openNewPlayer() {
    resetPlayerForm()
    setShowPlayerForm(true)
  }

  function openEditPlayer(p) {
    setEditingId(p.id)
    setPName(p.name)
    setPCategory(p.category)
    setPPositions(p.positions || [])
    setPSide(p.side || 'ikke_aktuelt')
    setPTeam(p.team_id || '')
    setShowPlayerForm(true)
    window.scrollTo(0, 0)
  }

  function togglePosition(pos) {
    setPPositions(pPositions.includes(pos)
      ? pPositions.filter((x) => x !== pos)
      : [...pPositions, pos])
  }

  async function savePlayer() {
    if (!pName.trim()) return
    const payload = {
      name: pName.trim(),
      category: pCategory,
      positions: pPositions,
      side: pSide,
      team_id: pTeam || null,
    }
    let error
    if (editingId) {
      ;({ error } = await supabase.from('players').update(payload).eq('id', editingId))
    } else {
      ;({ error } = await supabase.from('players').insert({ ...payload, created_by: session.user.id }))
    }
    if (!error) {
      resetPlayerForm()
      setShowPlayerForm(false)
      load()
    } else {
      alert('Kunne ikke gemme spilleren: ' + error.message)
    }
  }

  async function movePlayer(playerId, teamId) {
    await supabase.from('players').update({ team_id: teamId || null, movement: null }).eq('id', playerId)
    load()
  }

  async function deletePlayer(p) {
    if (!confirm(`Slet spilleren "${p.name}"?`)) return
    await supabase.from('players').delete().eq('id', p.id)
    load()
  }

  async function toggleMovement(p, type) {
    if (p.movement === type) {
      await supabase.from('players').update({ movement: null }).eq('id', p.id)
    } else {
      const teamPlayers = players.filter((x) => x.team_id === p.team_id && x.id !== p.id)
      const already = teamPlayers.filter((x) => x.movement === type).length
      if (already >= 2) {
        alert(`Der er allerede markeret 2 ${type === 'op' ? 'oprykkere' : 'nedrykkere'} på dette hold. Fjern en markering først.`)
        return
      }
      await supabase.from('players').update({ movement: type }).eq('id', p.id)
    }
    load()
  }

  function onDragStart(e, playerId) {
    e.dataTransfer.setData('text/plain', playerId)
    e.dataTransfer.effectAllowed = 'move'
  }
  function onDrop(e, teamId) {
    e.preventDefault()
    setDragOverTeam(null)
    const playerId = e.dataTransfer.getData('text/plain')
    if (playerId) movePlayer(playerId, teamId)
  }

  const unassigned = players.filter((p) => !p.team_id)

  function PlayerRow({ p, showMovement }) {
    return (
      <div
        className="player-row"
        draggable
        onDragStart={(e) => onDragStart(e, p.id)}
        title="Træk spilleren over på et hold, eller brug 'Flyt til'"
      >
        <span className="drag-handle" aria-hidden="true">⠿</span>
        <span className="player-name">{p.name}</span>
        <span className={`chip chip-small cat-${p.category}`}>{p.category}</span>
        {(p.positions || []).map((pos) => (
          <span key={pos} className="chip chip-small chip-pos">{pos}</span>
        ))}
        {p.side && p.side !== 'ikke_aktuelt' && (
          <span className="chip chip-small chip-side">{sideLabel(p.side)}</span>
        )}
        {p.movement === 'op' && <span className="chip chip-small chip-op">⬆ Oprykker</span>}
        {p.movement === 'ned' && <span className="chip chip-small chip-ned">⬇ Nedrykker</span>}
        <span className="player-actions">
          {showMovement && (
            <>
              <button
                className={`btn btn-icon ${p.movement === 'op' ? 'active-op' : ''}`}
                onClick={() => toggleMovement(p, 'op')}
                title="Markér som oprykker (max 2 pr. hold)"
              >⬆</button>
              <button
                className={`btn btn-icon ${p.movement === 'ned' ? 'active-ned' : ''}`}
                onClick={() => toggleMovement(p, 'ned')}
                title="Markér som nedrykker (max 2 pr. hold)"
              >⬇</button>
            </>
          )}
          <button className="btn btn-icon" onClick={() => openEditPlayer(p)} title="Redigér spilleren">✎</button>
          <select
            className="move-select"
            value=""
            onChange={(e) => { if (e.target.value !== '') movePlayer(p.id, e.target.value === 'none' ? null : e.target.value) }}
            title="Flyt spilleren til et andet hold"
          >
            <option value="">Flyt til…</option>
            {p.team_id && <option value="none">Uden hold</option>}
            {teams.filter((t) => t.id !== p.team_id).map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button className="btn btn-icon" onClick={() => deletePlayer(p)} title="Slet spilleren">✕</button>
        </span>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Hold & spillere</h1>
          <p className="page-sub">Opret og redigér spillere, træk dem på hold, og markér op- og nedrykkere.</p>
        </div>
        <div className="head-actions">
          <button className="btn btn-ghost" onClick={() => { if (showPlayerForm) resetPlayerForm(); setShowPlayerForm(!showPlayerForm) }}>
            {showPlayerForm ? 'Luk' : '+ Ny spiller'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowTeamForm(!showTeamForm)}>
            {showTeamForm ? 'Luk' : '+ Nyt hold'}
          </button>
        </div>
      </div>

      {showTeamForm && (
        <div className="card form-card">
          <h3 className="section-title">Nyt hold</h3>
          <div className="form-row">
            <label className="field">
              <span>Holdnavn</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="F.eks. U10 Drenge" />
            </label>
            <label className="field">
              <span>Årgang / aldersgruppe</span>
              <input value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} placeholder="F.eks. 2016" />
            </label>
            <label className="field">
              <span>Trænere</span>
              <input value={trainers} onChange={(e) => setTrainers(e.target.value)} placeholder="F.eks. Kenneth, Lars" />
            </label>
          </div>
          <label className="field">
            <span>Noter</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Baner, andet praktisk…" />
          </label>
          <button className="btn btn-primary" onClick={addTeam}>Gem hold</button>
        </div>
      )}

      {showPlayerForm && (
        <div className="card form-card">
          <h3 className="section-title">{editingId ? 'Redigér spiller' : 'Ny spiller'}</h3>
          <div className="form-row">
            <label className="field">
              <span>Navn</span>
              <input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Spillerens navn" />
            </label>
            <label className="field">
              <span>Kategori</span>
              <select value={pCategory} onChange={(e) => setPCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Hold</span>
              <select value={pTeam} onChange={(e) => setPTeam(e.target.value)}>
                <option value="">Uden hold</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
          </div>

          <div className="field">
            <span>Positioner (vælg en eller flere)</span>
            <div className="position-picker">
              {allKnownPositions.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  className={`pos-chip ${pPositions.includes(pos) ? 'selected' : ''}`}
                  onClick={() => togglePosition(pos)}
                >
                  {pPositions.includes(pos) ? '✓ ' : ''}{pos}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span>Side</span>
            <div className="position-picker">
              {SIDE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`pos-chip ${pSide === opt.value ? 'selected' : ''}`}
                  onClick={() => setPSide(opt.value)}
                >
                  {pSide === opt.value ? '✓ ' : ''}{opt.label}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" onClick={savePlayer}>
            {editingId ? 'Gem ændringer' : 'Gem spiller'}
          </button>
          {editingId && (
            <button className="btn btn-link" onClick={() => { resetPlayerForm(); setShowPlayerForm(false) }}>Annullér</button>
          )}
        </div>
      )}

      {loading ? (
        <p className="muted">Henter hold og spillere…</p>
      ) : (
        <>
          <div
            className={`card pool-card ${dragOverTeam === 'none' ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOverTeam('none') }}
            onDragLeave={() => setDragOverTeam(null)}
            onDrop={(e) => onDrop(e, null)}
          >
            <h3 className="team-title">Uden hold <span className="muted">({unassigned.length})</span></h3>
            {unassigned.length === 0 ? (
              <p className="muted">Ingen spillere her. Opret spillere med "+ Ny spiller", eller træk spillere hertil for at fjerne dem fra et hold.</p>
            ) : (
              unassigned.map((p) => <PlayerRow key={p.id} p={p} showMovement={false} />)
            )}
          </div>

          {teams.length === 0 ? (
            <div className="empty">Ingen hold oprettet endnu. Tryk på "+ Nyt hold" for at komme i gang.</div>
          ) : (
            teams.map((t) => {
              const teamPlayers = players.filter((p) => p.team_id === t.id)
              return (
                <div
                  key={t.id}
                  className={`card team-card-wide ${dragOverTeam === t.id ? 'drag-over' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOverTeam(t.id) }}
                  onDragLeave={() => setDragOverTeam(null)}
                  onDrop={(e) => onDrop(e, t.id)}
                >
                  <div className="team-head">
                    <h3 className="team-title">
                      {t.name} {t.age_group && <span className="chip">{t.age_group}</span>}
                      <span className="muted"> · {teamPlayers.length} spiller(e)</span>
                    </h3>
                    <button className="btn btn-ghost btn-small" onClick={() => deleteTeam(t)}>Slet hold</button>
                  </div>
                  {t.trainers && <p className="muted"><span className="label">Trænere:</span> {t.trainers}</p>}
                  {t.notes && <p className="muted">{t.notes}</p>}
                  {teamPlayers.length === 0 ? (
                    <p className="muted drop-hint">Træk spillere hertil, eller brug "Flyt til…" på en spiller.</p>
                  ) : (
                    teamPlayers.map((p) => <PlayerRow key={p.id} p={p} showMovement={true} />)
                  )}
                </div>
              )
            })
          )}
        </>
      )}
    </div>
  )
}
