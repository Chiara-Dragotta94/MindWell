import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { apiRequest } from '../services/api.js'
import { isAuthenticated } from '../services/auth.js'

function PostDetailPage() {
  // Mostro il dettaglio di un post con interazioni social (like/commenti).
  const { postId } = useParams()
  const [postDettaglio, setPostDettaglio] = useState(null)
  const [commenti, setCommenti] = useState([])
  const [miPiaceAttivo, setMiPiaceAttivo] = useState(false)
  const [nuovoCommento, setNuovoCommento] = useState('')
  const [caricamento, setCaricamento] = useState(true)
  const [invioCommento, setInvioCommento] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    caricaPost()
  }, [postId])

  const caricaPost = async () => {
    try {
      const risposta = await apiRequest(`/community/posts/${postId}`)
      setPostDettaglio(risposta.post)
      setCommenti(risposta.comments || [])
      if (isAuthenticated()) {
        const rispostaLike = await apiRequest(`/community/posts/${postId}/liked`).catch(() => ({ liked: false }))
        setMiPiaceAttivo(rispostaLike.liked)
      }
    } catch {
      navigate('/community')
    } finally { setCaricamento(false) }
  }

  const handleLike = async () => {
    if (!isAuthenticated()) { navigate('/login'); return }
    try {
      const risposta = await apiRequest(`/community/posts/${postId}/like`, { method: 'POST' })
      setMiPiaceAttivo(risposta.liked)
      setPostDettaglio((precedente) => ({ ...precedente, likes_count: precedente.likes_count + (risposta.liked ? 1 : -1) }))
    } catch { /* ignore */ }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!isAuthenticated()) { navigate('/login'); return }
    if (!nuovoCommento.trim()) return
    setInvioCommento(true)
    try {
      await apiRequest(`/community/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: nuovoCommento.trim() })
      })
      setNuovoCommento('')
      caricaPost()
    } catch { /* ignore */ } finally { setInvioCommento(false) }
  }

  if (caricamento) return <div className="loading-page"><div className="loading-spinner" /></div>
  if (!postDettaglio) return null

  return (
    <section className="page">
      <Link to="/community" className="btn btn-secondary btn-sm mb-2">← Torna alla community</Link>

      <div className="card">
        <div className="post-header">
          <div className="avatar" style={{ background: postDettaglio.avatar_color || '#00B4A0' }}>
            {postDettaglio.first_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{postDettaglio.first_name}</div>
            <div className="text-xs text-muted">
              {new Date(postDettaglio.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <span className="category-badge" style={{ marginLeft: 'auto' }}>{postDettaglio.category}</span>
        </div>
        <h2 style={{ marginTop: '1rem' }}>{postDettaglio.title}</h2>
        <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text)', lineHeight: 1.7 }}>{postDettaglio.content}</p>
        <div className="flex-gap" style={{ marginTop: '1rem' }}>
          <button
            className={`btn btn-sm ${miPiaceAttivo ? 'btn-danger' : 'btn-outline'}`}
            onClick={handleLike}
          >
            {miPiaceAttivo ? '❤️' : '🤍'} {postDettaglio.likes_count || 0}
          </button>
          <span className="text-sm text-muted">💬 {commenti.length} commenti</span>
        </div>
      </div>

      <div className="card">
        <h3>Commenti ({commenti.length})</h3>
        {isAuthenticated() && (
          <form className="form" onSubmit={handleComment} style={{ marginBottom: '1.5rem' }}>
            <div className="form-row">
              <textarea
                value={nuovoCommento} onChange={(e) => setNuovoCommento(e.target.value)}
                placeholder="Scrivi una risposta gentile o un incoraggiamento..." rows={3}
              />
            </div>
            <button className="btn btn-primary btn-sm" type="submit" disabled={invioCommento}>
              {invioCommento ? 'Sto inviando...' : 'Commenta'}
            </button>
          </form>
        )}
        {commenti.length === 0 && <p className="text-secondary text-sm">Ancora nessun commento. Se vuoi, inizia tu.</p>}
        {commenti.map((c) => (
          <div key={c.id} className="comment-item">
            <div className="flex-gap" style={{ marginBottom: '0.3rem' }}>
              <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.7rem', background: c.avatar_color || '#00B4A0' }}>
                {c.first_name?.[0]?.toUpperCase() || '?'}
              </div>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.first_name}</span>
              <span className="text-xs text-muted">
                {new Date(c.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>{c.content}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default PostDetailPage
