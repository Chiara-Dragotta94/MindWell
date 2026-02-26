import express from "express";
import { dbAll, dbRun, dbGet } from "../lib/db.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

const CBT_PROMPTS = [
  {
    id: "pensiero_automatico",
    title: "Identifica il pensiero automatico",
    description: "Quando ti senti in difficoltà, spesso è perché un pensiero automatico si è attivato. Prova a catturarlo.",
    questions: [
      "Qual è la situazione che ti ha fatto stare male?",
      "Qual è il primo pensiero che ti è venuto in mente?",
      "Che emozioni hai provato? (tristezza, ansia, rabbia...)",
      "C'è una distorsione cognitiva? (catastrofizzazione, pensiero tutto-o-nulla, lettura del pensiero...)",
      "Quale potrebbe essere un pensiero alternativo più equilibrato?"
    ]
  },
  {
    id: "gratitudine",
    title: "Diario della gratitudine",
    description: "Riconoscere le cose positive, anche piccole, aiuta a ribilanciare la prospettiva.",
    questions: [
      "Scrivi 3 cose per cui sei grato/a oggi, anche piccole",
      "Perché queste cose sono importanti per te?",
      "C'è qualcuno a cui vorresti dire grazie?"
    ]
  },
  {
    id: "ristrutturazione",
    title: "Ristrutturazione cognitiva",
    description: "Sfida un pensiero negativo ricorrente sostituendolo con uno più realistico.",
    questions: [
      "Scrivi il pensiero negativo che ti tormenta",
      "Quali prove hai a favore di questo pensiero?",
      "Quali prove hai contro questo pensiero?",
      "Se un amico avesse questo pensiero, cosa gli diresti?",
      "Riscrivi il pensiero in modo più bilanciato"
    ]
  },
  {
    id: "valori",
    title: "Connessione con i valori",
    description: "Quando perdiamo di vista i nostri valori, ci sentiamo persi. Riconnettiti con ciò che conta.",
    questions: [
      "Quali sono i 3 valori più importanti nella tua vita?",
      "In che modo le tue azioni di oggi riflettono questi valori?",
      "Cosa potresti fare domani per vivere più in linea con essi?"
    ]
  },
  {
    id: "emozioni",
    title: "Esplorazione delle emozioni",
    description: "Le emozioni non sono né buone né cattive. Impara a riconoscerle e accoglierle.",
    questions: [
      "Che emozione stai provando in questo momento?",
      "Dove la senti nel corpo?",
      "Cosa sta cercando di dirti questa emozione?",
      "Di cosa hai bisogno adesso?"
    ]
  },
  {
    id: "self_compassion",
    title: "Auto-compassione",
    description: "Trattati con la stessa gentilezza che riserveresti a un caro amico.",
    questions: [
      "Per cosa ti stai giudicando duramente?",
      "Ricorda che la sofferenza è parte dell'esperienza umana. Chi altro potrebbe sentirsi così?",
      "Scrivi a te stesso/a una lettera di gentilezza, come faresti con un amico"
    ]
  }
];

router.get("/prompts", authRequired, (_req, res) => {
  res.json({ prompts: CBT_PROMPTS });
});

router.get("/", authRequired, async (req, res) => {
  try {
    const entries = await dbAll(
      `SELECT id, prompt_id, situation, automatic_thought, emotions,
              cognitive_distortion, rational_response, content, created_at
       FROM journal_entries
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 30`,
      [req.user.id]
    );
    res.json({ entries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

router.post("/", authRequired, async (req, res) => {
  try {
    const { promptId, situation, automaticThought, emotions, cognitiveDistortion, rationalResponse, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Il contenuto non può essere vuoto" });
    }

    const result = await dbRun(
      `INSERT INTO journal_entries
        (user_id, prompt_id, situation, automatic_thought, emotions, cognitive_distortion, rational_response, content)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        promptId || null,
        situation || null,
        automaticThought || null,
        emotions || null,
        cognitiveDistortion || null,
        rationalResponse || null,
        content.trim()
      ]
    );

    const count = await dbGet(`SELECT COUNT(*) as c FROM journal_entries WHERE user_id = ?`, [req.user.id]);
    const badges = [];
    if (count.c === 1) badges.push("primo_diario");
    if (count.c === 10) badges.push("scrittore");
    if (count.c === 30) badges.push("narratore");

    for (const b of badges) {
      await dbRun(`INSERT IGNORE INTO achievements (user_id, badge_type) VALUES (?, ?)`, [req.user.id, b]).catch(() => {});
    }

    res.status(201).json({ id: result.lastID, newBadges: badges });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

router.delete("/:id", authRequired, async (req, res) => {
  try {
    await dbRun(`DELETE FROM journal_entries WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id]);
    res.json({ message: "Voce eliminata" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

export default router;
