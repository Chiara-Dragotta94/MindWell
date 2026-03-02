import express from "express";
import { dbAll, dbRun, dbGet } from "../lib/db.js";
import { authRequired } from "../middleware/auth.js";
import pool from "../lib/db.js";

const router = express.Router();

router.get("/posts", authRequired, async (req, res) => {
  // In questa rotta espongo la bacheca community, con filtro facoltativo per categoria.
  try {
    const category = req.query.category;
    let sql = `
      SELECT p.id, p.title, p.content, p.category, p.created_at,
             u.first_name, u.avatar_color,
             (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count
      FROM posts p
      JOIN users u ON u.id = p.user_id
    `;
    const params = [];
    if (category && category !== "tutti") {
      sql += ` WHERE p.category = ?`;
      params.push(category);
    }
    sql += ` ORDER BY p.created_at DESC LIMIT 50`;

    const posts = await dbAll(sql, params);
    res.json({ posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

router.get("/posts/:id", authRequired, async (req, res) => {
  // In questa rotta carico dettaglio post e commenti in una sola risposta API.
  try {
    const post = await dbGet(
      `SELECT p.id, p.title, p.content, p.category, p.created_at, p.user_id,
              u.first_name, u.avatar_color,
              (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as likes_count
       FROM posts p JOIN users u ON u.id = p.user_id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (!post) return res.status(404).json({ error: "Post non trovato" });

    const comments = await dbAll(
      `SELECT c.id, c.content, c.created_at, u.first_name, u.avatar_color
       FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC`,
      [req.params.id]
    );

    res.json({ post, comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

router.post("/posts", authRequired, async (req, res) => {
  // In questa rotta creo un nuovo post e gestisco il badge del primo contributo.
  try {
    const { title, content, category } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ error: "Titolo e contenuto sono obbligatori" });
    }

    const validCategories = ["generale", "ansia", "depressione", "relazioni", "crescita", "mindfulness"];
    const cat = validCategories.includes(category) ? category : "generale";

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [insertResult] = await conn.query(
        `INSERT INTO posts (user_id, title, content, category) VALUES (?, ?, ?, ?)`,
        [req.user.id, title.trim(), content.trim(), cat]
      );

      const [countRows] = await conn.query(`SELECT COUNT(*) as c FROM posts WHERE user_id = ?`, [req.user.id]);
      const count = countRows[0];
      if (count.c === 1) {
        await conn.query(`INSERT IGNORE INTO achievements (user_id, badge_type) VALUES (?, 'primo_post')`, [req.user.id]);
      }

      await conn.commit();
      res.status(201).json({ id: insertResult.insertId });
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

router.post("/posts/:id/comments", authRequired, async (req, res) => {
  // In questa rotta inserisco un commento solo dopo aver verificato che il post esista.
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ error: "Il commento non può essere vuoto" });
    }

    const post = await dbGet(`SELECT id FROM posts WHERE id = ?`, [req.params.id]);
    if (!post) return res.status(404).json({ error: "Post non trovato" });

    const result = await dbRun(
      `INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)`,
      [req.params.id, req.user.id, content.trim()]
    );

    res.status(201).json({ id: result.lastID });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

router.post("/posts/:id/like", authRequired, async (req, res) => {
  // In questa rotta implemento like/unlike come toggle idempotente per l'utente corrente.
  try {
    const existing = await dbGet(
      `SELECT * FROM post_likes WHERE user_id = ? AND post_id = ?`,
      [req.user.id, req.params.id]
    );

    if (existing) {
      await dbRun(`DELETE FROM post_likes WHERE user_id = ? AND post_id = ?`, [req.user.id, req.params.id]);
      res.json({ liked: false });
    } else {
      await dbRun(`INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)`, [req.user.id, req.params.id]);
      res.json({ liked: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

router.get("/posts/:id/liked", authRequired, async (req, res) => {
  try {
    const row = await dbGet(
      `SELECT * FROM post_likes WHERE user_id = ? AND post_id = ?`,
      [req.user.id, req.params.id]
    );
    res.json({ liked: !!row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

export default router;
