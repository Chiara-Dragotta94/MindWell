import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getCurrentUser, logout } from './services/auth.js'
import HomePage from './pages/HomePage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import MoodTrackerPage from './pages/MoodTrackerPage.jsx'
import JournalPage from './pages/JournalPage.jsx'
import MindfulnessPage from './pages/MindfulnessPage.jsx'
import CommunityPage from './pages/CommunityPage.jsx'
import PostDetailPage from './pages/PostDetailPage.jsx'
import ChatbotPage from './pages/ChatbotPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import CrisisPage from './pages/CrisisPage.jsx'
import ProgressPage from './pages/ProgressPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

function App() {
  const [utente, setUtente] = useState(getCurrentUser())
  const [menuAperto, setMenuAperto] = useState(false)
  const navigate = useNavigate()
  const posizione = useLocation()

  useEffect(() => {
    setMenuAperto(false)
  }, [posizione.pathname])

  useEffect(() => {
    // Tengo sincronizzato lo stato utente tra più tab del browser.
    const aggiornaUtenteDaStorage = () => setUtente(getCurrentUser())
    window.addEventListener('storage', aggiornaUtenteDaStorage)
    return () => window.removeEventListener('storage', aggiornaUtenteDaStorage)
  }, [])

  const gestisciLogout = () => {
    logout()
    setUtente(null)
    navigate('/')
  }

  const classeLinkAttivo = (path) => (posizione.pathname === path ? 'active' : '')

  return (
    <div className="app-root">
      <nav className="navbar">
        <Link to="/" className="navbar-brand">
          <div className="logo-icon">M</div>
          <div>
            <span className="logo-text">MindWell</span>
            <span className="logo-sub">Benessere psicologico</span>
          </div>
        </Link>
        <button className="mobile-toggle" onClick={() => setMenuAperto(!menuAperto)}>
          {menuAperto ? '✕' : '☰'}
        </button>
        <div className={`nav-links${menuAperto ? ' open' : ''}`}>
          {!utente && (
            <>
              <Link to="/register" className={classeLinkAttivo('/register')}>Registrati</Link>
              <Link to="/login" className={classeLinkAttivo('/login')}>Accedi</Link>
            </>
          )}
          {utente && (
            <>
              <Link to="/dashboard" className={classeLinkAttivo('/dashboard')}>Dashboard</Link>
              <Link to="/mood" className={classeLinkAttivo('/mood')}>Umore</Link>
              <Link to="/journal" className={classeLinkAttivo('/journal')}>Diario</Link>
              <Link to="/mindfulness" className={classeLinkAttivo('/mindfulness')}>Mindfulness</Link>
              <Link to="/community" className={classeLinkAttivo('/community')}>Community</Link>
              <Link to="/chatbot" className={classeLinkAttivo('/chatbot')}>AI Chat</Link>
              <Link to="/progress" className={classeLinkAttivo('/progress')}>Progressi</Link>
              <Link to="/profile" className={classeLinkAttivo('/profile')}>Profilo</Link>
              <button className="btn-logout" onClick={gestisciLogout}>Esci</button>
            </>
          )}
        </div>
      </nav>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage user={utente} />} />
          <Route path="/register" element={<RegisterPage onAuth={setUtente} />} />
          <Route path="/login" element={<LoginPage onAuth={setUtente} />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/mood" element={<ProtectedRoute><MoodTrackerPage /></ProtectedRoute>} />
          <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
          <Route path="/mindfulness" element={<ProtectedRoute><MindfulnessPage /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
          <Route path="/community/:postId" element={<ProtectedRoute><PostDetailPage /></ProtectedRoute>} />
          <Route path="/chatbot" element={<ProtectedRoute><ChatbotPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/crisis" element={<CrisisPage />} />
          <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
        </Routes>
      </main>

      <footer className="app-footer">
        <p>
          MindWell - Il tuo benessere psicologico a portata di mano.{' '}
          <Link to="/crisis">Supporto in caso di crisi</Link>
        </p>
      </footer>
    </div>
  )
}

export default App
