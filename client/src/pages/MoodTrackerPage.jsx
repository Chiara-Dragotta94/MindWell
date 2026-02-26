import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api.js'
import { isAuthenticated } from '../services/auth.js'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

const MOODS = [
  { score: 1, emoji: '😢', label: 'Molto male' },
  { score: 2, emoji: '😟', label: 'Male' },
  { score: 3, emoji: '😐', label: 'Così così' },
  { score: 4, emoji: '🙂', label: 'Bene' },
  { score: 5, emoji: '😄', label: 'Molto bene' },
]

function MoodTrackerPage() {
  const [umoreSelezionato, setUmoreSelezionato] = useState(null)
  const [livelloEnergia, setLivelloEnergia] = useState(3)
  const [livelloAnsia, setLivelloAnsia] = useState(3)
  const [qualitaSonno, setQualitaSonno] = useState(3)
  const [notaUtente, setNotaUtente] = useState('')
  const [storicoUmore, setStoricoUmore] = useState([])
  const [datiSettimanali, setDatiSettimanali] = useState([])
  const [schedaAttiva, setSchedaAttiva] = useState('registra')
  const [caricamento, setCaricamento] = useState(true)
  const [salvataggio, setSalvataggio] = useState(false)
  const [messaggioSuccesso, setMessaggioSuccesso] = useState(null)
  const [messaggioErrore, setMessaggioErrore] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/login'); return }
    caricaDati()
  }, [navigate])

  const caricaDati = async () => {
    try {
      const [rispostaUmore, rispostaSettimanale] = await Promise.all([
        apiRequest('/moods'),
        apiRequest('/moods/weekly').catch(() => ({ weekly: [] })),
      ])
      setStoricoUmore(rispostaUmore.moods || [])
      setDatiSettimanali(rispostaSettimanale.weekly || [])
    } catch {
      // Se il caricamento fallisce non blocco l'intera pagina.
    } finally {
      setCaricamento(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!umoreSelezionato) { setMessaggioErrore('Seleziona come ti senti'); return }
    setMessaggioErrore(null)
    setSalvataggio(true)
    setMessaggioSuccesso(null)
    try {
      const risposta = await apiRequest('/moods', {
        method: 'POST',
        body: JSON.stringify({
          moodScore: umoreSelezionato.score, moodLabel: umoreSelezionato.label,
          energyLevel: livelloEnergia, anxietyLevel: livelloAnsia, sleepQuality: qualitaSonno,
          note: notaUtente || null
        })
      })
      setMessaggioSuccesso('Umore registrato!')
      if (risposta.newBadges?.length) setMessaggioSuccesso(`Umore registrato! Nuovo badge: ${risposta.newBadges.join(', ')}`)
      setUmoreSelezionato(null)
      setNotaUtente('')
      setLivelloEnergia(3)
      setLivelloAnsia(3)
      setQualitaSonno(3)
      caricaDati()
    } catch (err) {
      setMessaggioErrore(err.message)
    } finally {
      setSalvataggio(false)
    }
  }

  if (caricamento) return <div className="loading-page"><div className="loading-spinner" /></div>

  const datiGrafico = datiSettimanali.map((dato) => ({
    ...dato,
    day: new Date(dato.day).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' })
  }))

  return (
    <section className="page">
      <div className="page-header">
        <h1>Mood Tracker</h1>
        <p>Monitora il tuo umore quotidianamente per scoprire pattern e migliorare il tuo benessere</p>
      </div>

      <div className="tabs">
        <button className={`tab${schedaAttiva === 'registra' ? ' active' : ''}`} onClick={() => setSchedaAttiva('registra')}>Registra</button>
        <button className={`tab${schedaAttiva === 'storico' ? ' active' : ''}`} onClick={() => setSchedaAttiva('storico')}>Storico</button>
        <button className={`tab${schedaAttiva === 'grafici' ? ' active' : ''}`} onClick={() => setSchedaAttiva('grafici')}>Grafici</button>
      </div>

      {schedaAttiva === 'registra' && (
        <div className="card">
          <h2>Come ti senti oggi?</h2>
          {messaggioErrore && <div className="alert alert-error mb-2">{messaggioErrore}</div>}
          {messaggioSuccesso && <div className="alert alert-success mb-2">{messaggioSuccesso}</div>}
          <form className="form" onSubmit={handleSubmit}>
            <div className="mood-selector">
              {MOODS.map((umore) => (
                <div
                  key={umore.score}
                  className={`mood-option${umoreSelezionato?.score === umore.score ? ' selected' : ''}`}
                  onClick={() => setUmoreSelezionato(umore)}
                >
                  <span className="emoji">{umore.emoji}</span>
                  <span className="label">{umore.label}</span>
                </div>
              ))}
            </div>

            <div className="grid-3" style={{ marginTop: '1rem' }}>
              <div className="slider-group">
                <label>Energia: {livelloEnergia}/5</label>
                <input type="range" min="1" max="5" value={livelloEnergia} onChange={(e) => setLivelloEnergia(+e.target.value)} />
                <div className="slider-labels"><span>Bassa</span><span>Alta</span></div>
              </div>
              <div className="slider-group">
                <label>Ansia: {livelloAnsia}/5</label>
                <input type="range" min="1" max="5" value={livelloAnsia} onChange={(e) => setLivelloAnsia(+e.target.value)} />
                <div className="slider-labels"><span>Bassa</span><span>Alta</span></div>
              </div>
              <div className="slider-group">
                <label>Qualità sonno: {qualitaSonno}/5</label>
                <input type="range" min="1" max="5" value={qualitaSonno} onChange={(e) => setQualitaSonno(+e.target.value)} />
                <div className="slider-labels"><span>Scarsa</span><span>Ottima</span></div>
              </div>
            </div>

            <div className="form-row">
              <label>Note (opzionale)</label>
              <textarea value={notaUtente} onChange={(e) => setNotaUtente(e.target.value)} placeholder="Cosa sta influenzando il tuo umore oggi?" rows={3} />
            </div>

            <button className="btn btn-primary" type="submit" disabled={salvataggio}>
              {salvataggio ? 'Salvataggio...' : 'Registra umore'}
            </button>
          </form>
        </div>
      )}

      {schedaAttiva === 'storico' && (
        <div className="card">
          <h2>Storico dell'umore</h2>
          {storicoUmore.length === 0 && <p className="text-secondary">Nessun check-in registrato ancora.</p>}
          {storicoUmore.map((voceUmore) => (
            <div key={voceUmore.id} className="journal-entry">
              <div className="meta flex-between">
                <span>{MOODS.find((item) => item.score === voceUmore.mood_score)?.emoji} {voceUmore.mood_label}</span>
                <span>{new Date(voceUmore.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {voceUmore.energy_level && <span>Energia: {voceUmore.energy_level}/5</span>}
                {voceUmore.anxiety_level && <span>Ansia: {voceUmore.anxiety_level}/5</span>}
                {voceUmore.sleep_quality && <span>Sonno: {voceUmore.sleep_quality}/5</span>}
              </div>
              {voceUmore.note && <p className="content" style={{ marginTop: '0.4rem' }}>{voceUmore.note}</p>}
            </div>
          ))}
        </div>
      )}

      {schedaAttiva === 'grafici' && (
        <div className="card">
          <h2>Andamento settimanale</h2>
          {datiGrafico.length < 2 ? (
            <p className="text-secondary">Registra l'umore per almeno 2 giorni per vedere i grafici.</p>
          ) : (
            <>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart data={datiGrafico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F4" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis domain={[1, 5]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="avg_mood" name="Umore" stroke="#00B4A0" fill="#E0F7F4" strokeWidth={2} />
                    <Area type="monotone" dataKey="avg_energy" name="Energia" stroke="#FFD93D" fill="#FFF8E1" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ width: '100%', height: 250, marginTop: '1.5rem' }}>
                <ResponsiveContainer>
                  <LineChart data={datiGrafico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F4" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis domain={[1, 5]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="avg_anxiety" name="Ansia" stroke="#FF6B6B" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="avg_sleep" name="Sonno" stroke="#45B7D1" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}

export default MoodTrackerPage
