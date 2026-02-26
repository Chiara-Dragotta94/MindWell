import { Navigate, useLocation } from 'react-router-dom'
import { isAuthenticated } from '../services/auth.js'

function ProtectedRoute({ children }) {
  const posizione = useLocation()

  // Qui blocco le pagine private: se non sono autenticato, rimando al login
  // e mi salvo la pagina originale per riportare l'utente nel punto giusto.
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: posizione.pathname }} />
  }
  return children
}

export default ProtectedRoute
