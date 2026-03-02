import express from "express";
import { dbAll, dbRun, dbGet } from "../lib/db.js";
import { authRequired } from "../middleware/auth.js";
import pool from "../lib/db.js";

const router = express.Router();

router.get("/", authRequired, async (req, res) => {
  // In questa rotta carico la lista obiettivi con conteggio dei giorni completati.
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
  // In questa rotta creo un obiettivo nuovo e assegno il badge del primo obiettivo quando serve.
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
  // In questa rotta segno il completamento giornaliero e, se raggiunto il target, chiudo l'obiettivo.
  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [goalRows] = await conn.query(
        `SELECT * FROM goals WHERE id = ? AND user_id = ?`,
        [req.params.id, req.user.id]
      );
      const goal = goalRows[0];
      if (!goal) {
        await conn.rollback();
        return res.status(404).json({ error: "Obiettivo non trovato" });
      }

      const today = new Date().toISOString().split("T")[0];
      await conn.query(
        `INSERT IGNORE INTO goal_completions (goal_id, completed_at) VALUES (?, ?)`,
        [req.params.id, today]
      );

      const [completionRows] = await conn.query(
        `SELECT COUNT(*) as c FROM goal_completions WHERE goal_id = ?`,
        [req.params.id]
      );
      const completions = completionRows[0];

      if (completions.c >= goal.target_days) {
        await conn.query(`UPDATE goals SET is_active = 0 WHERE id = ?`, [req.params.id]);
        await conn.query(
          `INSERT IGNORE INTO achievements (user_id, badge_type) VALUES (?, 'obiettivo_completato')`,
          [req.user.id]
        );
      }

      await conn.commit();
      res.json({ completed: completions.c, target: goal.target_days });
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

router.delete("/:id", authRequired, async (req, res) => {
  // In questa rotta permetto all'utente di rimuovere un obiettivo solo se è suo.
  try {
    await dbRun(`DELETE FROM goals WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id]);
    res.json({ message: "Obiettivo eliminato" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

export default router;
