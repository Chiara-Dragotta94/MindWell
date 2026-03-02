import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api.js'
import { isAuthenticated } from '../services/auth.js'

function ChatbotPage() {
  // Gestisco la chat di supporto: cronologia, invio messaggi e reset conversazione.
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/login'); return }
    loadHistory()
  }, [navigate])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadHistory = async () => {
    try {
      const data = await apiRequest('/chatbot/history')
      setMessages(data.messages || [])
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || sending) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: userMsg }])
    setSending(true)

    try {
      const data = await apiRequest('/chatbot/message', {
        method: 'POST',
        body: JSON.stringify({ content: userMsg })
      })
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: data.reply }])
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: 'Mi dispiace, c\'è stato un errore. Riprova tra poco.' }])
    } finally { setSending(false) }
  }

  const handleClear = async () => {
    try {
      await apiRequest('/chatbot/history', { method: 'DELETE' })
      setMessages([])
    } catch { /* ignore */ }
  }

  if (loading) return <div className="loading-page"><div className="loading-spinner" /></div>

  return (
    <section className="page">
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1>Chat di supporto</h1>
            <p>Uno spazio per parlare e ricevere un aiuto rapido, quando ne hai bisogno.</p>
          </div>
          {messages.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={handleClear}>Cancella chat</button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="chat-container">
          <div className="chat-messages">
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
                <h3 style={{ margin: '0 0 0.5rem' }}>Ciao! Sono qui per te</h3>
                <p className="text-secondary text-sm" style={{ maxWidth: 400, margin: '0 auto' }}>
                  Posso aiutarti con tecniche per l'ansia, lo stress, il sonno,
                  o semplicemente ascoltarti. Scrivimi qualcosa!
                </p>
                <div className="flex-gap flex-wrap" style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
                  {['Ciao!', 'Mi sento ansioso/a', 'Non riesco a dormire', 'Sono stressato/a'].map(s => (
                    <button key={s} className="btn btn-secondary btn-sm" onClick={() => { setInput(s) }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-bubble ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {sending && (
              <div className="chat-bubble assistant" style={{ opacity: 0.6 }}>
                Sto pensando...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form className="chat-input-row" onSubmit={handleSend}>
            <input
              type="text" value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Scrivi un messaggio..." disabled={sending}
            />
            <button className="btn btn-primary" type="submit" disabled={sending || !input.trim()}>
              Invia
            </button>
          </form>
        </div>
      </div>

      <div className="alert alert-warning" style={{ marginTop: '0.5rem' }}>
        Questa chat offre supporto generale e non sostituisce un aiuto professionale.
        In caso di emergenza, contatta il <strong>Telefono Amico (02 2327 2327)</strong> o il <strong>112</strong>.
      </div>
    </section>
  )
}

export default ChatbotPage
