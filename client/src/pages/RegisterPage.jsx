import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { isAuthenticated, register } from '../services/auth.js'

function RegisterPage({ onAuth }) {
  // Applico validazioni progressive prima di creare l'account via API.
  const [datiForm, setDatiForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '', birthDate: ''
  })
  const [errore, setErrore] = useState(null)
  const [caricamento, setCaricamento] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated()) navigate('/dashboard')
  }, [navigate])

  const handleChange = (e) => {
    setDatiForm((precedente) => ({ ...precedente, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrore(null)
    const nomePulito = datiForm.firstName.trim()
    const cognomePulito = datiForm.lastName.trim()
    const emailNormalizzata = datiForm.email.trim().toLowerCase()
    const regexNome = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    // Applico una validazione lato client chiara e progressiva,
    // così guido subito l'utente prima ancora di chiamare l'API.
    if (datiForm.password !== datiForm.confirmPassword) {
      setErrore('Le due password non coincidono. Riprova con calma.')
      return
    }
    if (!regexNome.test(nomePulito) || !regexNome.test(cognomePulito)) {
      setErrore('Nome e cognome devono contenere solo lettere (minimo 2).')
      return
    }
    if (!regexEmail.test(emailNormalizzata)) {
      setErrore('Inserisci una email valida')
      return
    }
    if (
      datiForm.password.length < 8 ||
      !/[A-Z]/.test(datiForm.password) ||
      !/[a-z]/.test(datiForm.password) ||
      !/\d/.test(datiForm.password)
    ) {
      setErrore('La password deve avere almeno 8 caratteri, una maiuscola, una minuscola e un numero')
      return
    }
    if (datiForm.birthDate) {
      const dataNascita = new Date(datiForm.birthDate)
      if (Number.isNaN(dataNascita.getTime())) {
        setErrore('Data di nascita non valida')
        return
      }
      const oggi = new Date()
      const eta =
        oggi.getFullYear() -
        dataNascita.getFullYear() -
        (oggi.getMonth() < dataNascita.getMonth() ||
        (oggi.getMonth() === dataNascita.getMonth() && oggi.getDate() < dataNascita.getDate())
          ? 1
          : 0)
      if (eta < 16) {
        setErrore('Per registrarti devi avere almeno 16 anni.')
        return
      }
    }
    if (nomePulito === cognomePulito) {
      setErrore('Nome e cognome non possono essere uguali.')
      return
    }

    setCaricamento(true)
    try {
      const utente = await register({
        firstName: nomePulito, lastName: cognomePulito,
        email: emailNormalizzata, password: datiForm.password, birthDate: datiForm.birthDate || null
      })
      onAuth?.(utente)
      navigate('/dashboard')
    } catch (err) {
      setErrore(err.message)
    } finally {
      setCaricamento(false)
    }
  }

  return (
    <section className="page" style={{ maxWidth: 500, margin: '0 auto' }}>
      <div className="page-header text-center">
        <h1>Crea il tuo account</h1>
        <p>Inizia il tuo percorso di benessere con MindWell</p>
      </div>

      <div className="card">
        {errore && <div className="alert alert-error mb-2">{errore}</div>}
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-row">
              <label>Nome</label>
              <input type="text" name="firstName" required value={datiForm.firstName} onChange={handleChange} placeholder="Il tuo nome" />
            </div>
            <div className="form-row">
              <label>Cognome</label>
              <input type="text" name="lastName" required value={datiForm.lastName} onChange={handleChange} placeholder="Il tuo cognome" />
            </div>
          </div>
          <div className="form-row">
            <label>Data di nascita</label>
            <input type="date" name="birthDate" value={datiForm.birthDate} onChange={handleChange} />
          </div>
          <div className="form-row">
            <label>Email</label>
            <input type="email" name="email" required value={datiForm.email} onChange={handleChange} placeholder="la-tua@email.com" />
          </div>
          <div className="form-row">
            <label>Password</label>
            <input type="password" name="password" required value={datiForm.password} onChange={handleChange} placeholder="Minimo 8 caratteri" />
          </div>
          <div className="form-row">
            <label>Conferma Password</label>
            <input type="password" name="confirmPassword" required value={datiForm.confirmPassword} onChange={handleChange} placeholder="Ripeti la password" />
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={caricamento} style={{ width: '100%', justifyContent: 'center' }}>
            {caricamento ? 'Sto creando il tuo account...' : 'Registrati'}
          </button>
        </form>
        <p className="text-center text-sm mt-2">
          Hai già un account? <Link to="/login">Accedi qui</Link>
        </p>
      </div>
    </section>
  )
}

export default RegisterPage
