import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api.js'
import { isAuthenticated } from '../services/auth.js'

function JournalPage() {
  const [prompts, setPrompts] = useState([])
  const [entries, setEntries] = useState([])
  const [selectedPrompt, setSelectedPrompt] = useState(null)
  const [content, setContent] = useState('')
  const [situation, setSituation] = useState('')
  const [thought, setThought] = useState('')
  const [emotions, setEmotions] = useState('')
  const [distortion, setDistortion] = useState('')
  const [rational, setRational] = useState('')
  const [tab, setTab] = useState('scrivi')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/login'); return }
    loadData()
  }, [navigate])

  const loadData = async () => {
    try {
      const [p, e] = await Promise.all([
        apiRequest('/journal/prompts'),
        apiRequest('/journal'),
      ])
      setPrompts(p.prompts || [])
      setEntries(e.entries || [])
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  const resetForm = () => {
    setContent(''); setSituation(''); setThought('')
    setEmotions(''); setDistortion(''); setRational('')
    setSelectedPrompt(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) { setError('Scrivi qualcosa nel diario'); return }
    setError(null); setSaving(true); setSuccess(null)
    try {
      const res = await apiRequest('/journal', {
        method: 'POST',
        body: JSON.stringify({
          promptId: selectedPrompt?.id, content, situation,
          automaticThought: thought, emotions, cognitiveDistortion: distortion,
          rationalResponse: rational
        })
      })
      setSuccess('Voce salvata nel diario!')
      if (res.newBadges?.length) setSuccess(`Voce salvata! Nuovo badge: ${res.newBadges.join(', ')}`)
      resetForm()
      loadData()
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try {
      await apiRequest(`/journal/${id}`, { method: 'DELETE' })
      setEntries(entries.filter(e => e.id !== id))
    } catch { /* ignore */ }
  }

  if (loading) return <div className="loading-page"><div className="loading-spinner" /></div>

  const DISTORTIONS = [
    'Catastrofizzazione', 'Pensiero tutto-o-nulla', 'Lettura del pensiero',
    'Generalizzazione', 'Filtro mentale negativo', 'Squalifica del positivo',
    'Doverizzazione', 'Etichettamento', 'Personalizzazione', 'Ragionamento emotivo'
  ]

  return (
    <section className="page">
      <div className="page-header">
        <h1>Diario CBT</h1>
        <p>Scrittura terapeutica guidata per esplorare i tuoi pensieri e le tue emozioni</p>
      </div>

      <div className="tabs">
        <button className={`tab${tab === 'scrivi' ? ' active' : ''}`} onClick={() => setTab('scrivi')}>Scrivi</button>
        <button className={`tab${tab === 'storico' ? ' active' : ''}`} onClick={() => setTab('storico')}>Le tue voci</button>
      </div>

      {tab === 'scrivi' && (
        <>
          <div className="card">
            <h3>Scegli un prompt (opzionale)</h3>
            <p className="text-sm text-secondary mb-2">
              I prompt ti guidano nell'esplorazione dei tuoi pensieri usando tecniche della Terapia Cognitivo-Comportamentale.
            </p>
            <div className="grid-2">
              {prompts.map((p) => (
                <div
                  key={p.id}
                  className={`prompt-card${selectedPrompt?.id === p.id ? ' selected' : ''}`}
                  onClick={() => setSelectedPrompt(selectedPrompt?.id === p.id ? null : p)}
                >
                  <h4>{p.title}</h4>
                  <p>{p.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            {error && <div className="alert alert-error mb-2">{error}</div>}
            {success && <div className="alert alert-success mb-2">{success}</div>}
            <form className="form" onSubmit={handleSubmit}>
              {selectedPrompt && (
                <>
                  <div className="alert alert-info mb-1">
                    <strong>{selectedPrompt.title}</strong>
                    <div className="text-sm" style={{ marginTop: '0.3rem' }}>
                      {selectedPrompt.questions.map((q, i) => <div key={i}>• {q}</div>)}
                    </div>
                  </div>
                  <div className="form-row">
                    <label>Situazione</label>
                    <textarea value={situation} onChange={(e) => setSituation(e.target.value)} placeholder="Descrivi la situazione" rows={2} />
                  </div>
                  <div className="form-row">
                    <label>Pensiero automatico</label>
                    <textarea value={thought} onChange={(e) => setThought(e.target.value)} placeholder="Quale pensiero ti è venuto?" rows={2} />
                  </div>
                  <div className="form-row">
                    <label>Emozioni provate</label>
                    <input type="text" value={emotions} onChange={(e) => setEmotions(e.target.value)} placeholder="Es. tristezza, ansia, rabbia..." />
                  </div>
                  <div className="form-row">
                    <label>Distorsione cognitiva</label>
                    <select value={distortion} onChange={(e) => setDistortion(e.target.value)}>
                      <option value="">Seleziona (opzionale)</option>
                      {DISTORTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Pensiero alternativo</label>
                    <textarea value={rational} onChange={(e) => setRational(e.target.value)} placeholder="Qual è un modo più equilibrato di vedere la situazione?" rows={2} />
                  </div>
                </>
              )}
              <div className="form-row">
                <label>{selectedPrompt ? 'Riflessione finale' : 'Scrivi nel tuo diario'}</label>
                <textarea
                  value={content} onChange={(e) => setContent(e.target.value)}
                  placeholder="Scrivi liberamente, senza giudicarti. Questo spazio è solo tuo..."
                  rows={5} required
                />
              </div>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Salvataggio...' : 'Salva nel diario'}
              </button>
            </form>
          </div>
        </>
      )}

      {tab === 'storico' && (
        <div className="card">
          <h2>Le tue voci di diario</h2>
          {entries.length === 0 && <p className="text-secondary">Non hai ancora scritto nulla. Inizia ora!</p>}
          {entries.map((entry) => (
            <div key={entry.id} className="journal-entry">
              <div className="meta flex-between">
                <span>
                  {entry.prompt_id && <span className="category-badge" style={{ marginRight: '0.5rem' }}>{entry.prompt_id}</span>}
                  {new Date(entry.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(entry.id)}>Elimina</button>
              </div>
              {entry.situation && <div className="text-sm mt-1"><strong>Situazione:</strong> {entry.situation}</div>}
              {entry.automatic_thought && <div className="text-sm"><strong>Pensiero:</strong> {entry.automatic_thought}</div>}
              {entry.emotions && <div className="text-sm"><strong>Emozioni:</strong> {entry.emotions}</div>}
              {entry.cognitive_distortion && <div className="text-sm"><strong>Distorsione:</strong> {entry.cognitive_distortion}</div>}
              {entry.rational_response && <div className="text-sm"><strong>Pensiero alternativo:</strong> {entry.rational_response}</div>}
              <div className="content" style={{ marginTop: '0.5rem' }}>{entry.content}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default JournalPage
