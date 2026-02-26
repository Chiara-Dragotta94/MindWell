import express from "express";
import bcrypt from "bcrypt";
import { dbGet, dbRun } from "../lib/db.js";
import { generateToken, authRequired } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, birthDate } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "Tutti i campi sono obbligatori" });
    }

    const nomePulito = firstName.trim();
    const cognomePulito = lastName.trim();
    const emailNormalizzata = email.toLowerCase().trim();

    const regexNome = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/;
    if (!regexNome.test(nomePulito) || !regexNome.test(cognomePulito)) {
      return res.status(400).json({ error: "Nome e cognome possono contenere solo lettere" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizzata)) {
      return res.status(400).json({ error: "Indirizzo email non valido" });
    }

    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      return res.status(400).json({
        error: "La password deve avere almeno 8 caratteri, una maiuscola, una minuscola e un numero",
      });
    }

    if (birthDate) {
      const dataNascita = new Date(birthDate);
      if (Number.isNaN(dataNascita.getTime())) {
        return res.status(400).json({ error: "Data di nascita non valida" });
      }
      const oggi = new Date();
      const eta =
        oggi.getFullYear() -
        dataNascita.getFullYear() -
        (oggi.getMonth() < dataNascita.getMonth() ||
        (oggi.getMonth() === dataNascita.getMonth() && oggi.getDate() < dataNascita.getDate())
          ? 1
          : 0);
      if (eta < 16) {
        return res.status(400).json({ error: "Devi avere almeno 16 anni per registrarti" });
      }
    }

    // Qui blocco in anticipo duplicati evidenti per dare un messaggio chiaro all'utente.
    const utenteConStessaEmail = await dbGet(`SELECT id FROM users WHERE email = ?`, [emailNormalizzata]);
    if (utenteConStessaEmail) {
      return res.status(409).json({
        error: "Esiste già un profilo con questa email. Inserisci dati diversi oppure accedi.",
      });
    }

    if (birthDate) {
      const utenteConAnagraficaUguale = await dbGet(
        `SELECT id FROM users WHERE first_name = ? AND last_name = ? AND birth_date = ? LIMIT 1`,
        [nomePulito, cognomePulito, birthDate]
      );
      if (utenteConAnagraficaUguale) {
        return res.status(409).json({
          error:
            "Esiste già un profilo con questi dati anagrafici. Inserisci dati diversi oppure accedi.",
        });
      }
    }

    const password_hash = await bcrypt.hash(password, 10);
    const colors = ["#00B4A0", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FECA57", "#DDA0DD"];
    const avatar_color = colors[Math.floor(Math.random() * colors.length)];

    const result = await dbRun(
      `INSERT INTO users (first_name, last_name, email, password_hash, birth_date, avatar_color)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nomePulito, cognomePulito, emailNormalizzata, password_hash, birthDate || null, avatar_color]
    );

    const utente = { id: result.lastID, email: emailNormalizzata, first_name: nomePulito };
    const token = generateToken(utente);

    await dbRun(
      `INSERT IGNORE INTO achievements (user_id, badge_type) VALUES (?, 'benvenuto')`,
      [result.lastID]
    );

    res.status(201).json({ user: utente, token });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email già registrata" });
    }
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email e password sono obbligatorie" });
    }

    const emailNormalizzata = email.toLowerCase().trim();
    const utenteDb = await dbGet(`SELECT * FROM users WHERE email = ?`, [emailNormalizzata]);
    if (!utenteDb) {
      return res.status(401).json({ error: "Credenziali non valide" });
    }

    const passwordCorretta = await bcrypt.compare(password, utenteDb.password_hash);
    if (!passwordCorretta) {
      return res.status(401).json({ error: "Credenziali non valide" });
    }

    const dataOdierna = new Date().toISOString().split("T")[0];
    await dbRun(`UPDATE users SET last_active = ? WHERE id = ?`, [dataOdierna, utenteDb.id]);

    const utente = { id: utenteDb.id, email: utenteDb.email, first_name: utenteDb.first_name };
    const token = generateToken(utente);
    res.json({ user: utente, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

router.post("/logout", (_req, res) => {
  res.json({ message: "Logout effettuato" });
});

router.get("/me", authRequired, async (req, res) => {
  try {
    const utente = await dbGet(
      `SELECT id, first_name, last_name, email, birth_date, bio, avatar_color, streak_days, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );
    if (!utente) return res.status(404).json({ error: "Utente non trovato" });
    res.json({ user: utente });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
});

export default router;
