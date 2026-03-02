import { Link } from 'react-router-dom'

const FEATURES = [
  { icon: '📊', title: 'Mood Tracker', desc: 'Monitora il tuo umore ogni giorno con scale intuitive e visualizza i tuoi progressi', color: '#E0F7F4' },
  { icon: '📝', title: 'Diario personale', desc: 'Scrivi quello che senti e fai chiarezza nei momenti difficili', color: '#FFE8E8' },
  { icon: '🧘', title: 'Mindfulness', desc: 'Esercizi di meditazione, respirazione e rilassamento per ogni momento della giornata', color: '#FFF8E1' },
  { icon: '🤖', title: 'Chat di supporto', desc: 'Una chat sempre disponibile per aiutarti a fermarti e respirare', color: '#E8F0FE' },
  { icon: '💬', title: 'Community', desc: 'Forum di supporto dove condividere esperienze e ridurre il senso di solitudine', color: '#F3E5F5' },
  { icon: '🏆', title: 'Obiettivi e premi', desc: 'Piccoli traguardi per restare motivato/a giorno dopo giorno', color: '#E8F5E9' },
]

function HomePage({ user }) {
  // Presento l'app e mostro CTA diverse in base allo stato login.
  return (
    <section className="page">
      <div className="hero">
        <h1>Il tuo benessere psicologico, un passo alla volta</h1>
        <p>
          MindWell ti accompagna ogni giorno con strumenti semplici, esercizi guidati
          e una community dove non ti senti solo/a.
        </p>
        {!user ? (
          <div className="flex-gap" style={{ marginTop: '1.5rem', position: 'relative', zIndex: 1 }}>
            <Link to="/register" className="btn btn-white btn-lg">Inizia ora</Link>
            <Link to="/login" className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white' }}>
              Accedi
            </Link>
          </div>
        ) : (
          <Link to="/dashboard" className="btn btn-white btn-lg" style={{ marginTop: '1.5rem', position: 'relative', zIndex: 1 }}>
            Vai alla Dashboard
          </Link>
        )}
      </div>

      <div className="page-header" style={{ marginTop: '1rem' }}>
        <h1>Tutto ciò di cui hai bisogno</h1>
        <p>Strumenti pratici per aiutarti a stare meglio, un piccolo passo alla volta</p>
      </div>

      <div className="grid-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-card">
            <div className="feature-icon" style={{ background: f.color }}>{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="card card-teal" style={{ textAlign: 'center', padding: '2.5rem' }}>
        <h2>Hai bisogno di aiuto immediato?</h2>
        <p className="text-secondary" style={{ maxWidth: 500, margin: '0.5rem auto 1.25rem' }}>
          Se stai vivendo un momento molto difficile, chiedi aiuto subito: non devi affrontarlo da solo/a.
        </p>
        <Link to="/crisis" className="btn btn-danger">Supporto in caso di crisi</Link>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
        <h2>Inizia il tuo percorso di benessere</h2>
        <p className="text-secondary" style={{ maxWidth: 500, margin: '0.5rem auto 1.25rem' }}>
          Unisciti a migliaia di persone che hanno scelto di prendersi cura della propria salute mentale.
        </p>
        {!user && <Link to="/register" className="btn btn-primary btn-lg">Crea il tuo account</Link>}
        {user && <Link to="/dashboard" className="btn btn-primary btn-lg">Vai alla tua area</Link>}
      </div>
    </section>
  )
}

export default HomePage
