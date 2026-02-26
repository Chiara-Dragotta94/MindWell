import express from "express";
import bcrypt from "bcrypt";
import { dbGet, dbRun } from "../lib/db.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authRequired, async (req, res) => {
  try {
    const utente = await dbGet(
      `SELECT id, first_name, last_name, email, birth_date, bio, avatar_color, streak_days, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );
    if (!utente) return res.status(404).json({ error: "Utente non trovato" });
    res.json({ profile: utente });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

router.put("/", authRequired, async (req, res) => {
  try {
    const { firstName, lastName, bio, birthDate, avatarColor } = req.body;
    const regexNome = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/;
    const regexColore = /^#[0-9A-Fa-f]{6}$/;

    // Qui valido il payload anche lato server per non fidarmi solo del frontend.
    if (firstName && !regexNome.test(firstName.trim())) {
      return res.status(400).json({ error: "Nome non valido" });
    }
    if (lastName && !regexNome.test(lastName.trim())) {
      return res.status(400).json({ error: "Cognome non valido" });
    }
    if (bio && bio.length > 500) {
      return res.status(400).json({ error: "La bio non può superare 500 caratteri" });
    }
    if (birthDate) {
      const dataNascita = new Date(birthDate);
      if (Number.isNaN(dataNascita.getTime())) {
        return res.status(400).json({ error: "Data di nascita non valida" });
      }
    }
    if (avatarColor && !regexColore.test(avatarColor)) {
      return res.status(400).json({ error: "Colore avatar non valido" });
    }

    await dbRun(
      `UPDATE users SET
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        bio = COALESCE(?, bio),
        birth_date = COALESCE(?, birth_date),
        avatar_color = COALESCE(?, avatar_color)
       WHERE id = ?`,
      [
        firstName?.trim() || null,
        lastName?.trim() || null,
        bio ?? null,
        birthDate || null,
        avatarColor || null,
        req.user.id,
      ]
    );
    res.json({ message: "Profilo aggiornato" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

router.delete("/", authRequired, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "Inserisci la password per confermare l'eliminazione" });
    }

    const utente = await dbGet(`SELECT id, password_hash FROM users WHERE id = ?`, [req.user.id]);
    if (!utente) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    const passwordCorretta = await bcrypt.compare(password, utente.password_hash);
    if (!passwordCorretta) {
      return res.status(401).json({ error: "Password non corretta" });
    }

    await dbRun(`DELETE FROM users WHERE id = ?`, [req.user.id]);
    res.json({ message: "Profilo eliminato con successo" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

router.get("/stats", authRequired, async (req, res) => {
  try {
    const idUtente = req.user.id;
    const [umori, diari, obiettivi, badge, postCommunity] = await Promise.all([
      dbGet(`SELECT COUNT(*) as count FROM moods WHERE user_id = ?`, [idUtente]),
      dbGet(`SELECT COUNT(*) as count FROM journal_entries WHERE user_id = ?`, [idUtente]),
      dbGet(`SELECT COUNT(*) as count FROM goals WHERE user_id = ? AND is_active = 1`, [idUtente]),
      dbGet(`SELECT COUNT(*) as count FROM achievements WHERE user_id = ?`, [idUtente]),
      dbGet(`SELECT COUNT(*) as count FROM posts WHERE user_id = ?`, [idUtente]),
    ]);
    res.json({
      stats: {
        totalMoods: umori.count,
        totalJournals: diari.count,
        activeGoals: obiettivi.count,
        totalAchievements: badge.count,
        totalPosts: postCommunity.count,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

export default router;
