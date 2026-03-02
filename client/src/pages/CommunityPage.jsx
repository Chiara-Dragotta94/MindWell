import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiRequest } from '../services/api.js'
import { isAuthenticated } from '../services/auth.js'

const CATEGORIES = ['tutti', 'generale', 'ansia', 'depressione', 'relazioni', 'crescita', 'mindfulness']

function CommunityPage() {
  // Gestisco la bacheca community con filtri, creazione post e lista discussioni.
  const [listaPost, setListaPost] = useState([])
  const [categoriaAttiva, setCategoriaAttiva] = useState('tutti')
  const [mostraForm, setMostraForm] = useState(false)
  const [titoloPost, setTitoloPost] = useState('')
  const [contenutoPost, setContenutoPost] = useState('')
  const [categoriaNuovoPost, setCategoriaNuovoPost] = useState('generale')
  const [caricamento, setCaricamento] = useState(true)
  const [salvataggio, setSalvataggio] = useState(false)
  const [messaggioErrore, setMessaggioErrore] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    caricaPost()
  }, [categoriaAttiva])

  const caricaPost = async () => {
    try {
      const risposta = await apiRequest(`/community/posts?category=${categoriaAttiva}`)
      setListaPost(risposta.posts || [])
    } catch {
      // Non interrompo la pagina: mostro semplicemente lista vuota.
    } finally {
      setCaricamento(false)
    }
  }

  const handlePost = async (e) => {
    e.preventDefault()
    if (!isAuthenticated()) { navigate('/login'); return }
    if (!titoloPost.trim() || !contenutoPost.trim()) { setMessaggioErrore('Per pubblicare, scrivi sia un titolo sia il messaggio.'); return }
    setMessaggioErrore(null)
    setSalvataggio(true)
    try {
      await apiRequest('/community/posts', {
        method: 'POST',
        body: JSON.stringify({ title: titoloPost.trim(), content: contenutoPost.trim(), category: categoriaNuovoPost })
      })
      setTitoloPost('')
      setContenutoPost('')
      setMostraForm(false)
      caricaPost()
    } catch (err) {
      setMessaggioErrore(err.message)
    } finally {
      setSalvataggio(false)
    }
  }

  if (caricamento) return <div className="loading-page"><div className="loading-spinner" /></div>

  return (
    <section className="page">
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1>Community</h1>
            <p>Condividi quello che vivi e trova persone che ti capiscono.</p>
          </div>
          {isAuthenticated() && (
            <button className="btn btn-primary" onClick={() => setMostraForm(!mostraForm)}>
              {mostraForm ? 'Chiudi' : 'Nuovo post'}
            </button>
          )}
        </div>
      </div>

      {mostraForm && (
        <div className="card card-accent">
          <h3>Scrivi un nuovo post</h3>
          {messaggioErrore && <div className="alert alert-error mb-1">{messaggioErrore}</div>}
          <form className="form" onSubmit={handlePost}>
            <div className="form-row">
              <label>Titolo</label>
              <input type="text" value={titoloPost} onChange={(e) => setTitoloPost(e.target.value)} placeholder="Di cosa vuoi parlare?" required />
            </div>
            <div className="form-row">
              <label>Contenuto</label>
              <textarea value={contenutoPost} onChange={(e) => setContenutoPost(e.target.value)} placeholder="Condividi i tuoi pensieri, esperienze o domande..." rows={4} required />
            </div>
            <div className="form-row">
              <label>Categoria</label>
              <select value={categoriaNuovoPost} onChange={(e) => setCategoriaNuovoPost(e.target.value)}>
                {CATEGORIES.filter(c => c !== 'tutti').map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={salvataggio}>
              {salvataggio ? 'Sto pubblicando...' : 'Pubblica'}
            </button>
          </form>
        </div>
      )}

      <div className="tag-group">
        {CATEGORIES.map((c) => (
          <button key={c} className={`tag${categoriaAttiva === c ? ' active' : ''}`} onClick={() => setCategoriaAttiva(c)}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {listaPost.length === 0 && (
        <div className="card text-center">
          <p className="text-secondary">Qui non c'è ancora nulla. Se vuoi, puoi iniziare tu.</p>
        </div>
      )}

      {listaPost.map((post) => (
        <Link key={post.id} to={`/community/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="post-card">
            <div className="post-header">
              <div className="avatar" style={{ background: post.avatar_color || '#00B4A0' }}>
                {post.first_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{post.first_name}</div>
                <div className="text-xs text-muted">
                  {new Date(post.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <span className="category-badge" style={{ marginLeft: 'auto' }}>{post.category}</span>
            </div>
            <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.05rem' }}>{post.title}</h3>
            <p className="text-sm text-secondary" style={{ margin: 0 }}>
              {post.content.length > 200 ? post.content.slice(0, 200) + '...' : post.content}
            </p>
            <div className="post-meta">
              <span>❤️ {post.likes_count || 0}</span>
              <span>💬 {post.comments_count || 0} commenti</span>
            </div>
          </div>
        </Link>
      ))}
    </section>
  )
}

export default CommunityPage
