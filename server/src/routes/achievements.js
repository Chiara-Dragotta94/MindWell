import express from "express";
import { dbAll } from "../lib/db.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

// In questa mappa tengo il dizionario badge in un unico posto, così frontend e backend restano allineati.
const BADGE_META = {
  benvenuto: { name: "Benvenuto!", icon: "🌟", description: "Ti sei registrato su MindWell" },
  primo_umore: { name: "Prima emozione", icon: "🎯", description: "Hai registrato il tuo primo umore" },
  settimana_umore: { name: "Una settimana di consapevolezza", icon: "📊", description: "7 registrazioni dell'umore" },
  mese_umore: { name: "Un mese mindful", icon: "🏆", description: "30 registrazioni dell'umore" },
  primo_diario: { name: "Prima pagina", icon: "📝", description: "Hai scritto la tua prima voce di diario" },
  scrittore: { name: "Scrittore", icon: "✍️", description: "10 voci di diario" },
  narratore: { name: "Narratore", icon: "📚", description: "30 voci di diario" },
  primo_obiettivo: { name: "Primo passo", icon: "🎯", description: "Hai creato il tuo primo obiettivo" },
  obiettivo_completato: { name: "Missione compiuta", icon: "✅", description: "Hai completato un obiettivo" },
  primo_post: { name: "Voce alla community", icon: "💬", description: "Hai scritto il tuo primo post" },
  streak_7: { name: "7 giorni di fila", icon: "🔥", description: "Attivo per 7 giorni consecutivi" },
  mindful_explorer: { name: "Esploratore mindful", icon: "🧘", description: "Hai provato un esercizio di mindfulness" },
};

router.get("/", authRequired, async (req, res) => {
  // In questa rotta ritorno sia i badge ottenuti sia la lista completa con stato locked/unlocked.
  try {
    const earned = await dbAll(
      `SELECT badge_type, earned_at FROM achievements WHERE user_id = ? ORDER BY earned_at DESC`,
      [req.user.id]
    );

    const badges = earned.map((a) => ({
      ...a,
      ...(BADGE_META[a.badge_type] || { name: a.badge_type, icon: "🏅", description: "" }),
    }));

    const allBadges = Object.entries(BADGE_META).map(([type, meta]) => ({
      badge_type: type,
      ...meta,
      earned: earned.some((e) => e.badge_type === type),
      earned_at: earned.find((e) => e.badge_type === type)?.earned_at || null,
    }));

    res.json({ earned: badges, all: allBadges });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

export default router;
