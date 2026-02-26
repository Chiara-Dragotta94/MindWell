import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiRequest } from '../services/api.js'
import { isAuthenticated } from '../services/auth.js'

function DashboardPage() {
  const [utente, setUtente] = useState(null)
  const [statistiche, setStatistiche] = useState(null)
  const [umoriRecenti, setUmoriRecenti] = useState([])
  const [badgeOttenuti, setBadgeOttenuti] = useState([])
  const [caricamento, setCaricamento] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/login'); return }
    const caricaDashboard = async () => {
      try {
        const [rispostaUtente, rispostaStatistiche, rispostaUmore, rispostaBadge] = await Promise.all([
          apiRequest('/auth/me'),
          apiRequest('/profile/stats'),
          apiRequest('/moods?limit=5').catch(() => ({ moods: [] })),
          apiRequest('/achievements').catch(() => ({ earned: [] })),
        ])
        setUtente(rispostaUtente.user)
        setStatistiche(rispostaStatistiche.stats)
        setUmoriRecenti(rispostaUmore.moods?.slice(0, 5) || [])
        setBadgeOttenuti(rispostaBadge.earned?.slice(0, 6) || [])
      } catch {
        // Qui evito toast invasivi: se fallisce una sezione mostro la pagina comunque.
      } finally {
        setCaricamento(false)
      }
    }
    caricaDashboard()
  }, [navigate])

  if (caricamento) return <div className="loading-page"><div className="loading-spinner" /></div>

  const MOOD_EMOJIS = { 1: '😢', 2: '😟', 3: '😐', 4: '🙂', 5: '😄' }
  const azioniRapide = [
    { to: '/mood', icon: '📊', label: 'Registra umore', color: '#E0F7F4' },
    { to: '/journal', icon: '📝', label: 'Scrivi nel diario', color: '#FFE8E8' },
    { to: '/mindfulness', icon: '🧘', label: 'Mindfulness', color: '#FFF8E1' },
    { to: '/chatbot', icon: '🤖', label: 'Parla con l\'AI', color: '#E8F0FE' },
    { to: '/community', icon: '💬', label: 'Community', color: '#F3E5F5' },
    { to: '/crisis', icon: '🆘', label: 'Supporto crisi', color: '#FFE8E8' },
  ]

  return (
    <section className="page">
      <div className="hero" style={{ padding: '2rem 2.5rem' }}>
        <h1>Ciao, {utente?.first_name || 'utente'}! 👋</h1>
        <p>Come stai oggi? Prenditi un momento per te e inizia con una delle azioni rapide qui sotto.</p>
      </div>

      <div className="grid-3">
        {azioniRapide.map((azione) => (
          <Link key={azione.to} to={azione.to} className="feature-card" style={{ textDecoration: 'none' }}>
            <div className="feature-icon" style={{ background: azione.color }}>{azione.icon}</div>
            <h3>{azione.label}</h3>
          </Link>
        ))}
      </div>

      {statistiche && (
        <div className="grid-4" style={{ marginTop: '0.5rem' }}>
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

      <div className="grid-2">
        <div className="card">
          <div className="flex-between mb-1">
            <h3>Umore recente</h3>
            <Link to="/mood" className="btn btn-sm btn-secondary">Vedi tutto</Link>
          </div>
          {umoriRecenti.length === 0 && (
            <p className="text-secondary text-sm">Nessun check-in ancora. Inizia registrando il tuo umore!</p>
          )}
          {umoriRecenti.map((umore) => (
            <div key={umore.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '1.5rem' }}>{MOOD_EMOJIS[umore.mood_score] || '😐'}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{umore.mood_label}</div>
                <div className="text-xs text-muted">{new Date(umore.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="flex-between mb-1">
            <h3>I tuoi badge</h3>
            <Link to="/progress" className="btn btn-sm btn-secondary">Tutti i badge</Link>
          </div>
          {badgeOttenuti.length === 0 && (
            <p className="text-secondary text-sm">Completa attività per sbloccare badge!</p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {badgeOttenuti.map((badge) => (
              <div key={badge.badge_type} className="badge-card earned" style={{ flex: '0 0 calc(33.33% - 0.75rem)' }}>
                <span className="badge-icon">{badge.icon}</span>
                <span className="badge-name">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default DashboardPage
