import express from "express";
import { dbAll, dbRun, dbGet } from "../lib/db.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authRequired, async (req, res) => {
  try {
    const goals = await dbAll(
      `SELECT g.id, g.title, g.description, g.category, g.target_days, g.is_active, g.created_at,
              (SELECT COUNT(*) FROM goal_completions gc WHERE gc.goal_id = g.id) as completed_days
       FROM goals g
       WHERE g.user_id = ?
       ORDER BY g.is_active DESC, g.created_at DESC`,
      [req.user.id]
    );
    res.json({ goals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

router.post("/", authRequired, async (req, res) => {
  try {
    const { title, description, category, targetDays } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Il titolo è obbligatorio" });
    }

    const result = await dbRun(
      `INSERT INTO goals (user_id, title, description, category, target_days)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, title.trim(), description || null, category || "generale", targetDays || 7]
    );

    const count = await dbGet(`SELECT COUNT(*) as c FROM goals WHERE user_id = ?`, [req.user.id]);
    if (count.c === 1) {
      await dbRun(`INSERT IGNORE INTO achievements (user_id, badge_type) VALUES (?, 'primo_obiettivo')`, [req.user.id]).catch(() => {});
    }

    res.status(201).json({ id: result.lastID });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

router.post("/:id/complete", authRequired, async (req, res) => {
  try {
    const goal = await dbGet(
      `SELECT * FROM goals WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!goal) return res.status(404).json({ error: "Obiettivo non trovato" });

    const today = new Date().toISOString().split("T")[0];
    await dbRun(
      `INSERT IGNORE INTO goal_completions (goal_id, completed_at) VALUES (?, ?)`,
      [req.params.id, today]
    );

    const completions = await dbGet(
      `SELECT COUNT(*) as c FROM goal_completions WHERE goal_id = ?`,
      [req.params.id]
    );

    if (completions.c >= goal.target_days) {
      await dbRun(`UPDATE goals SET is_active = 0 WHERE id = ?`, [req.params.id]);
      await dbRun(
        `INSERT IGNORE INTO achievements (user_id, badge_type) VALUES (?, 'obiettivo_completato')`,
        [req.user.id]
      ).catch(() => {});
    }

    res.json({ completed: completions.c, target: goal.target_days });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

router.delete("/:id", authRequired, async (req, res) => {
  try {
    await dbRun(`DELETE FROM goals WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id]);
    res.json({ message: "Obiettivo eliminato" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

export default router;
