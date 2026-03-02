import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAuthenticated } from '../services/auth.js'

const EXERCISES = [
  {
    id: 'body-scan', icon: '🧘', title: 'Scansione corporea',
    duration: '10 min', category: 'meditazione',
    description: 'Rilassa progressivamente ogni parte del corpo, dalla testa ai piedi.',
    steps: [
      'Sdraiati o siediti comodamente. Chiudi gli occhi.',
      'Porta l\'attenzione alla sommità della testa. Nota qualsiasi sensazione.',
      'Scendi lentamente verso la fronte, gli occhi, le guance, la mascella. Rilascia ogni tensione.',
      'Porta l\'attenzione al collo e alle spalle. Lasciale cadere dolcemente.',
      'Scendi lungo le braccia, le mani, le dita. Senti il peso delle braccia.',
      'Nota il petto e l\'addome. Senti il respiro che li muove.',
      'Porta l\'attenzione alla schiena, ai fianchi, al bacino.',
      'Scendi lungo le gambe, le ginocchia, i polpacci, le caviglie.',
      'Arriva ai piedi e alle dita dei piedi. Senti il contatto con la superficie.',
      'Ora senti tutto il corpo come un\'unica unità. Resta qui per qualche respiro.'
    ]
  },
  {
    id: 'grounding-54321', icon: '🌍', title: 'Grounding 5-4-3-2-1',
    duration: '5 min', category: 'ansia',
    description: 'Tecnica di radicamento per riportarti nel momento presente quando l\'ansia sale.',
    steps: [
      'Fermati e fai 3 respiri profondi.',
      'Nomina 5 COSE che puoi VEDERE intorno a te.',
      'Nomina 4 COSE che puoi TOCCARE.',
      'Nomina 3 COSE che puoi SENTIRE (suoni).',
      'Nomina 2 COSE che puoi ODORARE.',
      'Nomina 1 COSA che puoi GUSTARE.',
      'Fai altri 3 respiri profondi. Nota come ti senti ora.'
    ]
  },
  {
    id: 'gratitude', icon: '🙏', title: 'Meditazione della gratitudine',
    duration: '8 min', category: 'meditazione',
    description: 'Coltiva un senso di gratitudine per le cose belle della tua vita.',
    steps: [
      'Siediti comodamente e chiudi gli occhi.',
      'Pensa a 3 cose per cui sei grato/a oggi, anche piccole.',
      'Per ognuna, senti la gratitudine nel corpo. Dove la percepisci?',
      'Pensa a una persona che ha avuto un impatto positivo nella tua vita.',
      'Invia mentalmente un pensiero di gratitudine a questa persona.',
      'Pensa a qualcosa di te stesso/a per cui sei grato/a.',
      'Resta con questa sensazione per qualche respiro.',
      'Apri gli occhi quando sei pronto/a.'
    ]
  },
  {
    id: 'muscle-relax', icon: '💪', title: 'Rilassamento muscolare progressivo',
    duration: '12 min', category: 'rilassamento',
    description: 'Contrai e rilascia i muscoli per sciogliere la tensione fisica.',
    steps: [
      'Siediti o sdraiati comodamente.',
      'Stringi i pugni per 5 secondi... poi rilascia. Nota la differenza.',
      'Contrai le braccia per 5 secondi... poi rilascia.',
      'Alza le spalle verso le orecchie per 5 secondi... poi rilascia.',
      'Contrai i muscoli del viso per 5 secondi... poi rilascia.',
      'Contrai i muscoli dell\'addome per 5 secondi... poi rilascia.',
      'Contrai le gambe per 5 secondi... poi rilascia.',
      'Contrai i piedi per 5 secondi... poi rilascia.',
      'Ora senti tutto il corpo rilassato. Resta con questa sensazione.'
    ]
  },
  {
    id: 'sleep', icon: '🌙', title: 'Meditazione per il sonno',
    duration: '15 min', category: 'sonno',
    description: 'Guida dolce per rilassare mente e corpo prima di dormire.',
    steps: [
      'Sdraiati nel letto. Spegni le luci.',
      'Chiudi gli occhi. Fai 5 respiri profondi e lenti.',
      'Immagina un luogo sicuro e tranquillo. Può essere reale o immaginario.',
      'Nota i dettagli di questo luogo: i colori, i suoni, la temperatura.',
      'Senti il tuo corpo sprofondare nel materasso, sempre più pesante.',
      'Con ogni espirazione, lascia andare un pensiero o una preoccupazione.',
      'Non devi fare nulla. Solo essere qui, in questo momento.',
      'Se i pensieri arrivano, osservali come nuvole che passano.',
      'Continua a respirare dolcemente... lasciati andare al sonno.'
    ]
  },
]

const BREATHING_PATTERNS = [
  { name: 'Respirazione 4-7-8', inhale: 4, hold: 7, exhale: 8, desc: 'Ideale per calmare ansia e favorire il sonno' },
  { name: 'Respirazione quadrata', inhale: 4, hold: 4, exhale: 4, holdAfter: 4, desc: 'Aiuta a ritrovare calma e concentrazione' },
  { name: 'Respirazione diaframmatica', inhale: 4, hold: 0, exhale: 6, desc: 'Rallenta il ritmo e scioglie la tensione' },
]

function MindfulnessPage() {
  // Gestisco due modalità: esercizi step-by-step e respirazione guidata con timer.
  const [tab, setTab] = useState('esercizi')
  const [activeExercise, setActiveExercise] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [breathingPattern, setBreathingPattern] = useState(null)
  const [breathPhase, setBreathPhase] = useState('pronto')
  const [breathCount, setBreathCount] = useState(0)
  const [timer, setTimer] = useState(0)
  const intervalRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/login'); return }
  }, [navigate])

  const startBreathing = useCallback((pattern) => {
    setBreathingPattern(pattern)
    setBreathPhase('inhale')
    setBreathCount(0)
    setTimer(pattern.inhale)

    let phase = 'inhale'
    let count = 0

    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          if (phase === 'inhale') {
            if (pattern.hold > 0) {
              phase = 'hold'
              setBreathPhase('hold')
              return pattern.hold
            } else {
              phase = 'exhale'
              setBreathPhase('exhale')
              return pattern.exhale
            }
          } else if (phase === 'hold') {
            phase = 'exhale'
            setBreathPhase('exhale')
            return pattern.exhale
          } else if (phase === 'exhale') {
            if (pattern.holdAfter) {
              phase = 'holdAfter'
              setBreathPhase('hold')
              return pattern.holdAfter
            }
            count++
            setBreathCount(count)
            if (count >= 8) {
              clearInterval(intervalRef.current)
              setBreathPhase('completato')
              return 0
            }
            phase = 'inhale'
            setBreathPhase('inhale')
            return pattern.inhale
          } else if (phase === 'holdAfter') {
            count++
            setBreathCount(count)
            if (count >= 8) {
              clearInterval(intervalRef.current)
              setBreathPhase('completato')
              return 0
            }
            phase = 'inhale'
            setBreathPhase('inhale')
            return pattern.inhale
          }
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const stopBreathing = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setBreathingPattern(null)
    setBreathPhase('pronto')
    setBreathCount(0)
  }

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const phaseLabels = { inhale: 'Inspira', hold: 'Trattieni', exhale: 'Espira', pronto: 'Pronto?', completato: 'Completato!' }

  return (
    <section className="page">
      <div className="page-header">
        <h1>Mindfulness e Rilassamento</h1>
        <p>Esercizi semplici per respirare meglio, calmarti e ritrovare equilibrio.</p>
      </div>

      <div className="tabs">
        <button className={`tab${tab === 'esercizi' ? ' active' : ''}`} onClick={() => setTab('esercizi')}>Esercizi guidati</button>
        <button className={`tab${tab === 'respirazione' ? ' active' : ''}`} onClick={() => setTab('respirazione')}>Respirazione</button>
      </div>

      {tab === 'esercizi' && !activeExercise && (
        <div className="grid-2">
          {EXERCISES.map((ex) => (
            <div key={ex.id} className="exercise-card" onClick={() => { setActiveExercise(ex); setCurrentStep(0) }} style={{ cursor: 'pointer' }}>
              <div className="exercise-icon">{ex.icon}</div>
              <h3>{ex.title}</h3>
              <p>{ex.description}</p>
              <div className="flex-between">
                <span className="exercise-duration">{ex.duration}</span>
                <span className="category-badge">{ex.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'esercizi' && activeExercise && (
        <div className="card">
          <div className="flex-between mb-2">
            <h2>{activeExercise.icon} {activeExercise.title}</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveExercise(null)}>Chiudi</button>
          </div>
          <div className="alert alert-info mb-2">
            Passo {currentStep + 1} di {activeExercise.steps.length}
          </div>
          <div style={{ fontSize: '1.15rem', padding: '2rem', textAlign: 'center', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {activeExercise.steps[currentStep]}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1rem' }}>
            <button className="btn btn-outline" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0}>
              Indietro
            </button>
            {currentStep < activeExercise.steps.length - 1 ? (
              <button className="btn btn-primary" onClick={() => setCurrentStep(currentStep + 1)}>Avanti</button>
            ) : (
              <button className="btn btn-primary" onClick={() => setActiveExercise(null)}>Completato!</button>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.3rem', marginTop: '1rem' }}>
            {activeExercise.steps.map((_, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i <= currentStep ? 'var(--primary)' : 'var(--border)' }} />
            ))}
          </div>
        </div>
      )}

      {tab === 'respirazione' && !breathingPattern && (
        <div className="grid-3">
          {BREATHING_PATTERNS.map((bp) => (
            <div key={bp.name} className="exercise-card" onClick={() => startBreathing(bp)} style={{ cursor: 'pointer' }}>
              <div className="exercise-icon">🫁</div>
              <h3>{bp.name}</h3>
              <p>{bp.desc}</p>
              <div className="text-sm text-primary" style={{ marginTop: '0.5rem' }}>
                {bp.inhale}s inspira {bp.hold > 0 ? `- ${bp.hold}s trattieni` : ''} - {bp.exhale}s espira
                {bp.holdAfter ? ` - ${bp.holdAfter}s trattieni` : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'respirazione' && breathingPattern && (
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>{breathingPattern.name}</h2>
          <p className="text-secondary">Ciclo {breathCount + 1}/8</p>
          <div className={`breathing-circle ${breathPhase}`}>
            <div>
              <div style={{ fontSize: '1.5rem' }}>{phaseLabels[breathPhase]}</div>
              {breathPhase !== 'completato' && breathPhase !== 'pronto' && (
                <div style={{ fontSize: '2rem', fontWeight: 700 }}>{timer}</div>
              )}
            </div>
          </div>
          <button className="btn btn-danger" onClick={stopBreathing} style={{ marginTop: '1rem' }}>
            {breathPhase === 'completato' ? 'Chiudi' : 'Interrompi'}
          </button>
        </div>
      )}
    </section>
  )
}

export default MindfulnessPage
