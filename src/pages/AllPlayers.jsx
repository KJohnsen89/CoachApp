import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'

const SIDE_LABELS = { ikke_aktuelt: 'Ikke aktuelt', venstre: 'Venstre', midt: 'Midt', hojre: 'Højre' }

export default function AllPlayers() {
  const [players, setPlayers] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Alle')
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState('asc')

  async function load() {
    const [pl, tm] = await Promise.all([
      supabase.from('players').select('*'),
      supabase.from('teams').select('id, name'),
    ])
    setPlayers(pl.data || [])
    setTeams(tm.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const teamNameById = useMemo(() => {
    const map = {}
    teams.forEach((t) => { map[t.id] = t.name })
    return map
  }, [teams])

  function toggleSort(key) {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const rows = useMemo(() => {
    let list = players.map((p) => ({
      ...p,
      teamName: p.team_id ? (teamNameById[p.team_id] || '—') : 'Uden hold',
      positionsText: (p.positions || []).join(', '),
    }))
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.teamName.toLowerCase().includes(q))
    }
    if (categoryFilter !== 'Alle') {
      list = list.filter((p) => p.category === categoryFilter)
    }
    list.sort((a, b) => {
      const av = String(a[sortKey] ?? '').toLowerCase()
      const bv = String(b[sortKey] ?? '').toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [players, teamNameById, search, categoryFilter, sortKey, sortDir])

  function arrow(key) {
    return sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''
  }

  return (
    <div className="page">
      <h1 className="page-title">Spillere</h1>
      <p className="page-sub">Samlet oversigt over alle spillere på tværs af hold.</p>

      <div className="roster-controls">
        <input
          className="roster-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Søg efter navn eller hold…"
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="Alle">Alle kategorier</option>
          <option value="A">Kategori A</option>
          <option value="B">Kategori B</option>
          <option value="C">Kategori C</option>
        </select>
      </div>

      {loading ? (
        <p className="muted">Henter spillere…</p>
      ) : rows.length === 0 ? (
        <div className="empty">Ingen spillere matcher din søgning.</div>
      ) : (
        <div className="roster-table-wrap">
          <table className="roster-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('name')}>Navn{arrow('name')}</th>
                <th onClick={() => toggleSort('category')}>Kategori{arrow('category')}</th>
                <th onClick={() => toggleSort('positionsText')}>Positioner{arrow('positionsText')}</th>
                <th onClick={() => toggleSort('side')}>Side{arrow('side')}</th>
                <th onClick={() => toggleSort('teamName')}>Hold{arrow('teamName')}</th>
                <th>Mærke</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td><span className={`chip chip-small cat-${p.category}`}>{p.category}</span></td>
                  <td>{p.positionsText || '—'}</td>
                  <td>{p.side && p.side !== 'ikke_aktuelt' ? SIDE_LABELS[p.side] : '—'}</td>
                  <td>{p.teamName}</td>
                  <td>
                    {p.movement === 'op' && <span className="chip chip-small chip-op">⬆ Op</span>}
                    {p.movement === 'ned' && <span className="chip chip-small chip-ned">⬇ Ned</span>}
                    {!p.movement && '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted" style={{ marginTop: '0.75rem' }}>Redigér en spiller under "Hold".</p>
    </div>
  )
}
