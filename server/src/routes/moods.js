import express from "express";
import { dbAll, dbRun, dbGet } from "../lib/db.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authRequired, async (req, res) => {
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
  try {
    const { moodScore, moodLabel, energyLevel, anxietyLevel, sleepQuality, note } = req.body;

    if (!moodScore || !moodLabel) {
      return res.status(400).json({ error: "Seleziona come ti senti" });
    }
    if (moodScore < 1 || moodScore > 5) {
      return res.status(400).json({ error: "Il valore dell'umore deve essere tra 1 e 5" });
    }

    const result = await dbRun(
      `INSERT INTO moods (user_id, mood_score, mood_label, energy_level, anxiety_level, sleep_quality, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, moodScore, moodLabel, energyLevel || null, anxietyLevel || null, sleepQuality || null, note || null]
    );

    const count = await dbGet(`SELECT COUNT(*) as c FROM moods WHERE user_id = ?`, [req.user.id]);
    const badges = [];
    if (count.c === 1) badges.push("primo_umore");
    if (count.c === 7) badges.push("settimana_umore");
    if (count.c === 30) badges.push("mese_umore");

    for (const b of badges) {
      await dbRun(
        `INSERT IGNORE INTO achievements (user_id, badge_type) VALUES (?, ?)`,
        [req.user.id, b]
      ).catch(() => {});
    }

    const today = new Date().toISOString().split("T")[0];
    await dbRun(`UPDATE users SET last_active = ? WHERE id = ?`, [today, req.user.id]);

    res.status(201).json({ id: result.lastID, newBadges: badges });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

router.get("/weekly", authRequired, async (req, res) => {
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
