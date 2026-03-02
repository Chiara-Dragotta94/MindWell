import express from "express";
import { dbAll, dbRun } from "../lib/db.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

// In questa mappa preparo risposte predefinite per offrire supporto immediato senza dipendenze esterne.
const RESPONSES = {
  ansia: [
    "L'ansia può essere davvero opprimente. Ricorda che quello che senti è una risposta naturale del corpo. Proviamo un esercizio: inspira per 4 secondi, trattieni per 4, espira per 6. Ripeti 3 volte.",
    "Quando l'ansia sale, prova la tecnica del 5-4-3-2-1: nomina 5 cose che vedi, 4 che puoi toccare, 3 che senti, 2 che puoi odorare, 1 che puoi gustare.",
    "È importante sapere che l'ansia non è pericolosa, anche se la sensazione è sgradevole. Il tuo corpo sta cercando di proteggerti. Prova a respirare lentamente e ricorda che passerà.",
  ],
  tristezza: [
    "La tristezza è un'emozione umana e valida. Non devi reprimerla. Permettiti di sentirla, ma ricorda anche che non definisce chi sei.",
    "Quando ci sentiamo tristi, tendiamo a isolarci. Prova a fare una piccola cosa gentile per te: una passeggiata, una tazza di tè, ascoltare una canzone che ti piace.",
    "Scrivere di quello che senti può aiutare. Prova a tenere un diario delle emozioni nella sezione Journal dell'app.",
  ],
  stress: [
    "Lo stress cronico può esaurire le nostre risorse. Proviamo a spezzare il ciclo: quale una piccola azione puoi fare ora per alleggerire il carico?",
    "La tecnica della scansione corporea può aiutare: chiudi gli occhi, parti dalla testa e scendi piano verso i piedi, notando dove senti tensione. Respira in quelle zone.",
    "Ricorda: non devi fare tutto perfettamente. 'Abbastanza bene' è spesso sufficiente. Prova a dare priorità alle cose veramente importanti oggi.",
  ],
  sonno: [
    "L'igiene del sonno è fondamentale. Prova a: spegnere gli schermi 1 ora prima, mantenere la stanza fresca e buia, e andare a letto alla stessa ora.",
    "Se i pensieri ti tengono sveglio, prova a scriverli su un foglio prima di dormire. Questo 'scarica' la mente e ti permette di lasciarli andare.",
    "Una meditazione guidata prima di dormire può fare miracoli. Prova la sezione Mindfulness dell'app per esercizi di rilassamento serale.",
  ],
  generale: [
    "Sono qui per ascoltarti. Raccontami cosa ti passa per la mente. Non c'è giudizio qui.",
    "Prendersi cura della propria salute mentale è un atto di coraggio. Stai già facendo qualcosa di importante semplicemente essendo qui.",
    "Ogni giorno è un nuovo inizio. Anche i piccoli passi contano nel percorso verso il benessere.",
    "Ricorda: non sei solo/a in questo. Molte persone attraversano momenti difficili e trovano il modo di andare avanti.",
  ],
  saluto: [
    "Ciao! Sono il tuo assistente di benessere. Come stai oggi? Posso aiutarti con tecniche per l'ansia, lo stress, il sonno o semplicemente ascoltarti.",
    "Benvenuto/a! Sono qui per supportarti. Come posso aiutarti oggi?",
  ],
  grazie: [
    "Di niente! Sono sempre qui se hai bisogno. Ricorda che prendersi cura di sé è importante.",
    "Sono contento di poterti aiutare. Non esitare a tornare quando vuoi.",
  ],
  crisi: [
    "Se ti trovi in una situazione di emergenza o crisi, ti prego di contattare il Telefono Amico (02 2327 2327) o il Telefono Azzurro (19696). Se sei in pericolo immediato, chiama il 112. Vai alla pagina Crisi dell'app per i numeri di emergenza.",
  ],
};

function detectIntent(message) {
  // In questa funzione classifico in modo semplice il messaggio per scegliere la risposta più utile.
  const lower = message.toLowerCase();
  if (/\b(ciao|buongiorno|buonasera|salve|hey|hi|hello)\b/.test(lower)) return "saluto";
  if (/\b(grazie|thanks|ringrazi)\b/.test(lower)) return "grazie";
  if (/\b(suicid|morire|farla finita|non ce la faccio più|emergenza|aiuto urgente)\b/.test(lower)) return "crisi";
  if (/\b(ansi|panico|paura|agitaz|nervos|preoccup|attacco)\b/.test(lower)) return "ansia";
  if (/\b(trist|depres|piang|solo|sola|vuoto|vuota|senza speranza|disper)\b/.test(lower)) return "tristezza";
  if (/\b(stress|esaust|stanco|stanca|burnout|sovraccaric|pressione)\b/.test(lower)) return "stress";
  if (/\b(sonno|dormi|insonnia|notte|sveglio|sveglia|riposo)\b/.test(lower)) return "sonno";
  return "generale";
}

router.get("/history", authRequired, async (req, res) => {
  // In questa rotta ritorno la cronologia completa della chat utente.
  try {
    const messages = await dbAll(
      `SELECT id, role, content, created_at FROM chat_messages
       WHERE user_id = ? ORDER BY created_at ASC LIMIT 100`,
      [req.user.id]
    );
    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

router.post("/message", authRequired, async (req, res) => {
  // In questa rotta salvo domanda/risposta e restituisco il reply scelto in base all'intent.
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ error: "Il messaggio non può essere vuoto" });
    }

    await dbRun(
      `INSERT INTO chat_messages (user_id, role, content) VALUES (?, 'user', ?)`,
      [req.user.id, content.trim()]
    );

    const intent = detectIntent(content);
    const pool = RESPONSES[intent];
    const reply = pool[Math.floor(Math.random() * pool.length)];

    await dbRun(
      `INSERT INTO chat_messages (user_id, role, content) VALUES (?, 'assistant', ?)`,
      [req.user.id, reply]
    );

    res.json({ reply, intent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

router.delete("/history", authRequired, async (req, res) => {
  try {
    await dbRun(`DELETE FROM chat_messages WHERE user_id = ?`, [req.user.id]);
    res.json({ message: "Cronologia cancellata" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

export default router;
