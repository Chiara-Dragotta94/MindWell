import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api.js'
import { isAuthenticated } from '../services/auth.js'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function ProgressPage() {
  const [statistiche, setStatistiche] = useState(null)
  const [badge, setBadge] = useState({ earned: [], all: [] })
  const [obiettivi, setObiettivi] = useState([])
  const [datiMensili, setDatiMensili] = useState([])
  const [schedaAttiva, setSchedaAttiva] = useState('panoramica')
  const [caricamento, setCaricamento] = useState(true)
  const [titoloObiettivo, setTitoloObiettivo] = useState('')
  const [descrizioneObiettivo, setDescrizioneObiettivo] = useState('')
  const [categoriaObiettivo, setCategoriaObiettivo] = useState('generale')
  const [giorniObiettivo, setGiorniObiettivo] = useState(7)
  const [mostraFormObiettivo, setMostraFormObiettivo] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/login'); return }
    caricaDati()
  }, [navigate])

  const caricaDati = async () => {
    try {
      const [rispostaStatistiche, rispostaBadge, rispostaObiettivi, rispostaMensile] = await Promise.all([
        apiRequest('/profile/stats'),
        apiRequest('/achievements'),
        apiRequest('/goals'),
        apiRequest('/moods/monthly').catch(() => ({ monthly: [] })),
      ])
      setStatistiche(rispostaStatistiche.stats)
      setBadge(rispostaBadge)
      setObiettivi(rispostaObiettivi.goals || [])
      setDatiMensili(rispostaMensile.monthly || [])
    } catch {
      // In caso di errore lascio la pagina visibile senza bloccarla.
    } finally {
      setCaricamento(false)
    }
  }

  const handleNewGoal = async (e) => {
    e.preventDefault()
    if (!titoloObiettivo.trim()) return
    try {
      await apiRequest('/goals', {
        method: 'POST',
        body: JSON.stringify({
          title: titoloObiettivo.trim(),
          description: descrizioneObiettivo,
          category: categoriaObiettivo,
          targetDays: giorniObiettivo,
        })
      })
      setTitoloObiettivo('')
      setDescrizioneObiettivo('')
      setMostraFormObiettivo(false)
      caricaDati()
    } catch { /* ignore */ }
  }

  const handleCompleteGoal = async (id) => {
    try {
      await apiRequest(`/goals/${id}/complete`, { method: 'POST' })
      caricaDati()
    } catch { /* ignore */ }
  }

  const handleDeleteGoal = async (id) => {
    try {
      await apiRequest(`/goals/${id}`, { method: 'DELETE' })
      caricaDati()
    } catch { /* ignore */ }
  }

  if (caricamento) return <div className="loading-page"><div className="loading-spinner" /></div>

  const datiGrafico = datiMensili.map((dato) => ({
    ...dato,
    day: new Date(dato.day).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
  }))

  const GOAL_CATEGORIES = ['generale', 'mindfulness', 'esercizio', 'sociale', 'sonno', 'alimentazione', 'studio']

  return (
    <section className="page">
      <div className="page-header">
        <h1>I tuoi progressi</h1>
        <p>Monitora il tuo percorso di crescita personale e benessere</p>
      </div>

      <div className="tabs">
        <button className={`tab${schedaAttiva === 'panoramica' ? ' active' : ''}`} onClick={() => setSchedaAttiva('panoramica')}>Panoramica</button>
        <button className={`tab${schedaAttiva === 'obiettivi' ? ' active' : ''}`} onClick={() => setSchedaAttiva('obiettivi')}>Obiettivi</button>
        <button className={`tab${schedaAttiva === 'badge' ? ' active' : ''}`} onClick={() => setSchedaAttiva('badge')}>Badge</button>
      </div>

      {schedaAttiva === 'panoramica' && (
        <>
          {statistiche && (
            <div className="grid-4">
              <div className="stat-card">
                <div className="stat-value">{statistiche.totalMoods}</div>
                <div className="stat-label">Check-in umore</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{statistiche.totalJournals}</div>
                <div className="stat-label">Voci di diario</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{statistiche.activeGoals}</div>
                <div className="stat-label">Obiettivi attivi</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{statistiche.totalAchievements}</div>
                <div className="stat-label">Badge ottenuti</div>
              </div>
            </div>
          )}

          <div className="card">
            <h3>Andamento mensile dell'umore</h3>
            {datiGrafico.length < 2 ? (
              <p className="text-secondary">Registra l'umore per almeno 2 giorni per vedere il grafico.</p>
            ) : (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={datiGrafico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F4" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="avg_mood" name="Umore medio" fill="#00B4A0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}

      {schedaAttiva === 'obiettivi' && (
        <>
          <div className="flex-between mb-2">
            <h3>I tuoi obiettivi</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setMostraFormObiettivo(!mostraFormObiettivo)}>
              {mostraFormObiettivo ? 'Chiudi' : 'Nuovo obiettivo'}
            </button>
          </div>

          {mostraFormObiettivo && (
            <div className="card card-accent mb-2">
              <form className="form" onSubmit={handleNewGoal}>
                <div className="form-row">
                  <label>Titolo dell'obiettivo</label>
                  <input type="text" value={titoloObiettivo} onChange={(e) => setTitoloObiettivo(e.target.value)} placeholder="Es. Meditare 10 minuti" required />
                </div>
                <div className="form-row">
                  <label>Descrizione (opzionale)</label>
                  <input type="text" value={descrizioneObiettivo} onChange={(e) => setDescrizioneObiettivo(e.target.value)} placeholder="Dettagli sull'obiettivo" />
                </div>
                <div className="form-grid">
                  <div className="form-row">
                    <label>Categoria</label>
                    <select value={categoriaObiettivo} onChange={(e) => setCategoriaObiettivo(e.target.value)}>
                      {GOAL_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Giorni obiettivo</label>
                    <input type="number" min="1" max="365" value={giorniObiettivo} onChange={(e) => setGiorniObiettivo(+e.target.value)} />
                  </div>
                </div>
                <button className="btn btn-primary" type="submit">Crea obiettivo</button>
              </form>
            </div>
          )}

          {obiettivi.length === 0 && <div className="card"><p className="text-secondary">Nessun obiettivo ancora. Creane uno!</p></div>}

          {obiettivi.map((obiettivo) => {
            const percentuale = Math.min(100, Math.round((obiettivo.completed_days / obiettivo.target_days) * 100))
            return (
              <div key={obiettivo.id} className={`goal-item${!obiettivo.is_active ? ' completed' : ''}`} style={{ marginBottom: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <div className="flex-between">
                    <div>
                      <span style={{ fontWeight: 600 }}>{obiettivo.title}</span>
                      <span className="category-badge" style={{ marginLeft: '0.5rem' }}>{obiettivo.category}</span>
                    </div>
                    <span className="text-sm text-muted">{obiettivo.completed_days}/{obiettivo.target_days} giorni</span>
                  </div>
                  {obiettivo.description && <p className="text-xs text-muted" style={{ margin: '0.25rem 0' }}>{obiettivo.description}</p>}
                  <div className="goal-progress">
                    <div className="goal-progress-fill" style={{ width: `${percentuale}%` }} />
                  </div>
                </div>
                <div className="flex-gap" style={{ marginLeft: '1rem' }}>
                  {obiettivo.is_active && (
                    <button className="btn btn-sm btn-secondary" onClick={() => handleCompleteGoal(obiettivo.id)}>
                      Fatto oggi
                    </button>
                  )}
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteGoal(obiettivo.id)}>✕</button>
                </div>
              </div>
            )
          })}
        </>
      )}

      {schedaAttiva === 'badge' && (
        <div className="card">
          <h3>Tutti i badge</h3>
          <p className="text-secondary text-sm mb-2">
            Completa attività per sbloccare nuovi badge e monitorare i tuoi progressi.
          </p>
          <div className="grid-4">
            {(badge.all || []).map((singoloBadge) => (
              <div key={singoloBadge.badge_type} className={`badge-card ${singoloBadge.earned ? 'earned' : 'locked'}`}>
                <span className="badge-icon">{singoloBadge.icon}</span>
                <span className="badge-name">{singoloBadge.name}</span>
                <span className="badge-desc">{singoloBadge.description}</span>
                {singoloBadge.earned && singoloBadge.earned_at && (
                  <span className="text-xs text-muted">
                    {new Date(singoloBadge.earned_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default ProgressPage
