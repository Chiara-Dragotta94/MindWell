import express from "express";
import { dbAll } from "../lib/db.js";
import { authRequired } from "../middleware/auth.js";
import pool from "../lib/db.js";
import { MOOD_SCORE_MAX, MOOD_SCORE_MIN } from "../config/constants.js";

const router = express.Router();

router.get("/", authRequired, async (req, res) => {
  // In questa rotta restituisco lo storico umore dell'utente corrente in ordine dal più recente.
  try {
    const moods = await dbAll(
      `SELECT id, mood_score, mood_label, energy_level, anxiety_level, sleep_quality, note, created_at
       FROM moods WHERE user_id = ? ORDER BY created_at DESC LIMIT 60`,
      [req.user.id]
    );
    res.json({ moods });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

router.post("/", authRequired, async (req, res) => {
  // In questa rotta salvo una nuova registrazione umore e aggiorno eventuali badge.
  try {
    const { moodScore, moodLabel, energyLevel, anxietyLevel, sleepQuality, note } = req.body;

    if (!moodScore || !moodLabel) {
      return res.status(400).json({ error: "Seleziona come ti senti" });
    }
    if (moodScore < MOOD_SCORE_MIN || moodScore > MOOD_SCORE_MAX) {
      return res.status(400).json({ error: `Il valore dell'umore deve essere tra ${MOOD_SCORE_MIN} e ${MOOD_SCORE_MAX}` });
    }
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [insertResult] = await conn.query(
        `INSERT INTO moods (user_id, mood_score, mood_label, energy_level, anxiety_level, sleep_quality, note)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, moodScore, moodLabel, energyLevel || null, anxietyLevel || null, sleepQuality || null, note || null]
      );

      const [countRows] = await conn.query(`SELECT COUNT(*) as c FROM moods WHERE user_id = ?`, [req.user.id]);
      const count = countRows[0];
      const badges = [];
      if (count.c === 1) badges.push("primo_umore");
      if (count.c === 7) badges.push("settimana_umore");
      if (count.c === 30) badges.push("mese_umore");

      for (const b of badges) {
        await conn.query(
          `INSERT IGNORE INTO achievements (user_id, badge_type) VALUES (?, ?)`,
          [req.user.id, b]
        );
      }

      const today = new Date().toISOString().split("T")[0];
      await conn.query(`UPDATE users SET last_active = ? WHERE id = ?`, [today, req.user.id]);
      await conn.commit();

      res.status(201).json({ id: insertResult.insertId, newBadges: badges });
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

router.get("/weekly", authRequired, async (req, res) => {
  // In questa rotta aggrego gli ultimi 7 giorni per i grafici settimanali del frontend.
  try {
    const rows = await dbAll(
      `SELECT DATE(created_at) as day,
              ROUND(AVG(mood_score), 1) as avg_mood,
              ROUND(AVG(energy_level), 1) as avg_energy,
              ROUND(AVG(anxiety_level), 1) as avg_anxiety,
              ROUND(AVG(sleep_quality), 1) as avg_sleep
       FROM moods
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at)
       ORDER BY day`,
      [req.user.id]
    );
    res.json({ weekly: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

router.get("/monthly", authRequired, async (req, res) => {
  // In questa rotta aggrego gli ultimi 30 giorni per la vista progressi mensile.
  try {
    const rows = await dbAll(
      `SELECT DATE(created_at) as day,
              ROUND(AVG(mood_score), 1) as avg_mood,
              ROUND(AVG(energy_level), 1) as avg_energy,
              ROUND(AVG(anxiety_level), 1) as avg_anxiety,
              ROUND(AVG(sleep_quality), 1) as avg_sleep
       FROM moods
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY day`,
      [req.user.id]
    );
    res.json({ monthly: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

export default router;
