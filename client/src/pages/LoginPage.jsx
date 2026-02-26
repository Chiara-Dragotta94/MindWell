import { useEffect, useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { isAuthenticated, login } from '../services/auth.js'

function LoginPage({ onAuth }) {
  const [datiForm, setDatiForm] = useState({ email: '', password: '' })
  const [errore, setErrore] = useState(null)
  const [caricamento, setCaricamento] = useState(false)
  const navigate = useNavigate()
  const posizione = useLocation()

  useEffect(() => {
    if (isAuthenticated()) navigate('/dashboard')
  }, [navigate])

  const handleChange = (e) => {
    setDatiForm((precedente) => ({ ...precedente, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrore(null)
    const emailNormalizzata = datiForm.email.trim().toLowerCase()
    if (!emailNormalizzata || !datiForm.password) {
      setErrore('Email e password sono obbligatorie')
      return
    }
    setCaricamento(true)
    try {
      const utente = await login({ email: emailNormalizzata, password: datiForm.password })
      onAuth?.(utente)
      // Se arrivo da una rotta protetta, torno lì dopo il login.
      navigate(posizione.state?.from || '/dashboard')
    } catch (err) {
      setErrore(err.message)
    } finally {
      setCaricamento(false)
    }
  }

  return (
    <section className="page" style={{ maxWidth: 440, margin: '0 auto' }}>
      <div className="page-header text-center">
        <h1>Bentornato/a</h1>
        <p>Accedi al tuo spazio di benessere</p>
      </div>

      <div className="card">
        {errore && <div className="alert alert-error mb-2">{errore}</div>}
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Email</label>
            <input type="email" name="email" required value={datiForm.email} onChange={handleChange} placeholder="la-tua@email.com" />
          </div>
          <div className="form-row">
            <label>Password</label>
            <input type="password" name="password" required value={datiForm.password} onChange={handleChange} placeholder="La tua password" />
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={caricamento} style={{ width: '100%', justifyContent: 'center' }}>
            {caricamento ? 'Accesso...' : 'Accedi'}
          </button>
        </form>
        <p className="text-center text-sm mt-2">
          Non hai un account? <Link to="/register">Registrati</Link>
        </p>
      </div>
    </section>
  )
}

export default LoginPage
