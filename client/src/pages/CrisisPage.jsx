import { Link } from 'react-router-dom'

const EMERGENCY_NUMBERS = [
  { name: 'Telefono Amico', number: '02 2327 2327', desc: 'Servizio di ascolto attivo tutti i giorni dalle 10 alle 24' },
  { name: 'Telefono Azzurro', number: '19696', desc: 'Linea per bambini e adolescenti in difficoltà, attiva 24/7' },
  { name: 'Numero verde antiviolenza', number: '1522', desc: 'Supporto per vittime di violenza di genere, attivo 24/7' },
  { name: 'Emergenza sanitaria', number: '112 / 118', desc: 'In caso di pericolo immediato per la vita' },
  { name: 'Telefono Rosa', number: '06 3751 8282', desc: 'Contro la violenza sulle donne' },
]

const GROUNDING_STEPS = [
  { step: '5', sense: 'VISTA', instruction: 'Nomina 5 cose che puoi vedere intorno a te' },
  { step: '4', sense: 'TATTO', instruction: 'Nomina 4 cose che puoi toccare' },
  { step: '3', sense: 'UDITO', instruction: 'Nomina 3 cose che puoi sentire' },
  { step: '2', sense: 'OLFATTO', instruction: 'Nomina 2 cose che puoi odorare' },
  { step: '1', sense: 'GUSTO', instruction: 'Nomina 1 cosa che puoi gustare' },
]

function CrisisPage() {
  return (
    <section className="page">
      <div className="crisis-card">
        <h3>Stai attraversando un momento di crisi?</h3>
        <p style={{ margin: '0.5rem 0 1rem', fontSize: '0.95rem' }}>
          Se ti trovi in pericolo immediato o stai pensando di farti del male,
          chiama subito il <strong>112</strong> o recati al pronto soccorso più vicino.
          Non sei solo/a. Chiedere aiuto è un atto di coraggio.
        </p>
      </div>

      <div className="card">
        <h2>Numeri di emergenza</h2>
        <p className="text-secondary text-sm mb-2">Contatta uno di questi servizi se hai bisogno di parlare con qualcuno.</p>
        {EMERGENCY_NUMBERS.map((e) => (
          <div key={e.name} className="emergency-number">
            <div style={{ flex: '0 0 auto' }}>
              <div className="number">{e.number}</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{e.name}</div>
              <div className="desc">{e.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card card-teal">
        <h2>Tecnica di radicamento (Grounding) 5-4-3-2-1</h2>
        <p className="text-secondary mb-2">
          Se stai avendo un attacco di panico o ti senti sopraffatto/a, questa tecnica ti aiuta
          a riportare l'attenzione al momento presente.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {GROUNDING_STEPS.map((g) => (
            <div key={g.step} style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '1rem', borderRadius: 'var(--radius-md)',
              background: 'var(--surface)', border: '1px solid var(--border-light)'
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '1.2rem', flexShrink: 0
              }}>
                {g.step}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary-dark)' }}>{g.sense}</div>
                <div style={{ fontSize: '0.9rem' }}>{g.instruction}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Respirazione di emergenza</h2>
        <p className="text-secondary mb-2">
          Quando l'ansia sale, il respiro diventa corto. Prova questa sequenza:
        </p>
        <div className="grid-3" style={{ textAlign: 'center' }}>
          <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', background: 'var(--primary-light)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-dark)' }}>4s</div>
            <div className="text-sm" style={{ fontWeight: 600 }}>INSPIRA</div>
            <div className="text-xs text-muted">lentamente dal naso</div>
          </div>
          <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', background: 'var(--accent-light)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#F39C12' }}>7s</div>
            <div className="text-sm" style={{ fontWeight: 600 }}>TRATTIENI</div>
            <div className="text-xs text-muted">dolcemente</div>
          </div>
          <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', background: 'var(--secondary-light)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--secondary)' }}>8s</div>
            <div className="text-sm" style={{ fontWeight: 600 }}>ESPIRA</div>
            <div className="text-xs text-muted">lentamente dalla bocca</div>
          </div>
        </div>
        <p className="text-center text-sm text-muted mt-2">
          Ripeti per 4-8 cicli. Puoi anche provare l'esercizio guidato nella sezione{' '}
          <Link to="/mindfulness">Mindfulness</Link>.
        </p>
      </div>

      <div className="card">
        <h2>Ricorda</h2>
        <ul style={{ paddingLeft: '1.25rem', lineHeight: 2, color: 'var(--text-secondary)' }}>
          <li>Non devi affrontare tutto da solo/a. Chiedere aiuto è un segno di forza.</li>
          <li>Il dolore che senti ora non sarà per sempre. Le emozioni sono temporanee.</li>
          <li>Un professionista della salute mentale può aiutarti a trovare le strategie giuste.</li>
          <li>Questa app non sostituisce una terapia professionale, ma può essere un supporto quotidiano.</li>
        </ul>
      </div>
    </section>
  )
}

export default CrisisPage
