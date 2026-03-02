import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api.js'
import { isAuthenticated, logout } from '../services/auth.js'

const AVATAR_COLORS = ['#00B4A0', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#DDA0DD', '#FF8A65', '#7986CB']

function ProfilePage() {
  // Concentro tutto ciò che riguarda il profilo: modifica dati e cancellazione account.
  const [profilo, setProfilo] = useState(null)
  const [datiForm, setDatiForm] = useState({ firstName: '', lastName: '', bio: '', birthDate: '', avatarColor: '' })
  const [caricamento, setCaricamento] = useState(true)
  const [salvataggio, setSalvataggio] = useState(false)
  const [messaggioSuccesso, setMessaggioSuccesso] = useState(null)
  const [messaggioErrore, setMessaggioErrore] = useState(null)
  const [passwordEliminazione, setPasswordEliminazione] = useState('')
  const [eliminazioneInCorso, setEliminazioneInCorso] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/login'); return }
    caricaProfilo()
  }, [navigate])

  const caricaProfilo = async () => {
    try {
      const risposta = await apiRequest('/profile')
      setProfilo(risposta.profile)
      setDatiForm({
        firstName: risposta.profile.first_name || '',
        lastName: risposta.profile.last_name || '',
        bio: risposta.profile.bio || '',
        birthDate: risposta.profile.birth_date || '',
        avatarColor: risposta.profile.avatar_color || '#00B4A0',
      })
    } catch {
      // Evito rumore in console per non sporcare l'esperienza utente.
    } finally {
      setCaricamento(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessaggioErrore(null)
    setMessaggioSuccesso(null)
    setSalvataggio(true)
    const regexNome = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/
    if (!regexNome.test(datiForm.firstName.trim())) {
      setMessaggioErrore('Inserisci un nome valido (solo lettere).')
      setSalvataggio(false)
      return
    }
    if (!regexNome.test(datiForm.lastName.trim())) {
      setMessaggioErrore('Inserisci un cognome valido (solo lettere).')
      setSalvataggio(false)
      return
    }
    if (datiForm.bio.length > 500) {
      setMessaggioErrore('La bio non può superare 500 caratteri')
      setSalvataggio(false)
      return
    }
    try {
      await apiRequest('/profile', {
        method: 'PUT',
        body: JSON.stringify({
          ...datiForm,
          firstName: datiForm.firstName.trim(),
          lastName: datiForm.lastName.trim(),
        }),
      })
      setMessaggioSuccesso('Profilo aggiornato!')
      caricaProfilo()
    } catch (err) {
      setMessaggioErrore(err.message)
    } finally {
      setSalvataggio(false)
    }
  }

  const handleDeleteProfile = async () => {
    setMessaggioErrore(null)
    setMessaggioSuccesso(null)
    if (!passwordEliminazione) {
      setMessaggioErrore('Inserisci la password per eliminare il profilo')
      return
    }
    // Chiedo una conferma esplicita perché l'azione è irreversibile.
    const confermaEliminazione = window.confirm('Sei sicura di voler eliminare definitivamente il tuo profilo?')
    if (!confermaEliminazione) return
    setEliminazioneInCorso(true)
    try {
      await apiRequest('/profile', {
        method: 'DELETE',
        body: JSON.stringify({ password: passwordEliminazione }),
      })
      logout()
      navigate('/register')
    } catch (err) {
      setMessaggioErrore(err.message)
    } finally {
      setEliminazioneInCorso(false)
    }
  }

  if (caricamento) return <div className="loading-page"><div className="loading-spinner" /></div>

  return (
    <section className="page" style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="page-header">
        <h1>Il tuo profilo</h1>
        <p>Gestisci le tue informazioni personali</p>
      </div>

      <div className="card" style={{ textAlign: 'center', paddingBottom: '2rem' }}>
        <div className="avatar" style={{
          width: 80, height: 80, fontSize: '2rem', margin: '0 auto 1rem',
          background: datiForm.avatarColor
        }}>
          {datiForm.firstName?.[0]?.toUpperCase() || '?'}
        </div>
        <h2 style={{ margin: '0 0 0.25rem' }}>{profilo?.first_name} {profilo?.last_name}</h2>
        <p className="text-secondary text-sm">{profilo?.email}</p>
        <p className="text-muted text-xs">
          Membro dal {new Date(profilo?.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="card">
        <h3>Modifica profilo</h3>
        {messaggioErrore && <div className="alert alert-error mb-1">{messaggioErrore}</div>}
        {messaggioSuccesso && <div className="alert alert-success mb-1">{messaggioSuccesso}</div>}
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-row">
              <label>Nome</label>
              <input type="text" value={datiForm.firstName} onChange={(e) => setDatiForm(precedente => ({ ...precedente, firstName: e.target.value }))} />
            </div>
            <div className="form-row">
              <label>Cognome</label>
              <input type="text" value={datiForm.lastName} onChange={(e) => setDatiForm(precedente => ({ ...precedente, lastName: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <label>Data di nascita</label>
            <input type="date" value={datiForm.birthDate} onChange={(e) => setDatiForm(precedente => ({ ...precedente, birthDate: e.target.value }))} />
          </div>
          <div className="form-row">
            <label>Bio</label>
            <textarea
              value={datiForm.bio} onChange={(e) => setDatiForm(precedente => ({ ...precedente, bio: e.target.value }))}
              placeholder="Racconta qualcosa di te..." rows={3}
            />
          </div>
          <div className="form-row">
            <label>Colore avatar</label>
            <div className="flex-gap flex-wrap">
              {AVATAR_COLORS.map((c) => (
                <div
                  key={c}
                  onClick={() => setDatiForm(precedente => ({ ...precedente, avatarColor: c }))}
                  style={{
                    width: 36, height: 36, borderRadius: '50%', background: c,
                    cursor: 'pointer', border: datiForm.avatarColor === c ? '3px solid var(--text)' : '3px solid transparent',
                    transition: 'border 0.2s'
                  }}
                />
              ))}
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={salvataggio}>
            {salvataggio ? 'Sto salvando...' : 'Salva modifiche'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Elimina profilo</h3>
        <p className="text-secondary text-sm">
          Questa azione elimina tutto il tuo account. Per sicurezza, inserisci la password.
        </p>
        <div className="form-row">
          <label>Password di conferma</label>
          <input
            type="password"
            value={passwordEliminazione}
            onChange={(e) => setPasswordEliminazione(e.target.value)}
            placeholder="Inserisci la password"
          />
        </div>
        <button
          className="btn btn-danger mt-2"
          onClick={handleDeleteProfile}
          disabled={eliminazioneInCorso}
        >
          {eliminazioneInCorso ? 'Sto eliminando...' : 'Elimina profilo'}
        </button>
      </div>
    </section>
  )
}

export default ProfilePage
