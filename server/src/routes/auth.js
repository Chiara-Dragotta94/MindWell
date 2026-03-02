import express from "express";
import bcrypt from "bcrypt";
import { body } from "express-validator";
import { dbGet, dbRun } from "../lib/db.js";
import { generateToken, authRequired } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import {
  BCRYPT_SALT_ROUNDS,
  MIN_PASSWORD_LENGTH,
  MIN_REGISTER_AGE,
} from "../config/constants.js";
import pool from "../lib/db.js";

const router = express.Router();

router.post(
  "/register",
  [
    body("firstName")
      .trim()
      .notEmpty()
      .withMessage("Il nome è obbligatorio")
      .matches(/^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/)
      .withMessage("Nome e cognome possono contenere solo lettere"),
    body("lastName")
      .trim()
      .notEmpty()
      .withMessage("Il cognome è obbligatorio")
      .matches(/^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/)
      .withMessage("Nome e cognome possono contenere solo lettere"),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("L'email è obbligatoria")
      .isEmail()
      .withMessage("Indirizzo email non valido"),
    body("password")
      .notEmpty()
      .withMessage("La password è obbligatoria")
      .isLength({ min: MIN_PASSWORD_LENGTH })
      .withMessage(`La password deve avere almeno ${MIN_PASSWORD_LENGTH} caratteri`)
      .matches(/[A-Z]/)
      .withMessage("La password deve contenere almeno una lettera maiuscola")
      .matches(/[a-z]/)
      .withMessage("La password deve contenere almeno una lettera minuscola")
      .matches(/\d/)
      .withMessage("La password deve contenere almeno un numero"),
  ],
  validateRequest,
  async (req, res) => {
  // In questa rotta valido i dati in modo rigoroso prima di creare l'account.
  try {
    const { firstName, lastName, email, password, birthDate } = req.body;

    const nomePulito = firstName.trim();
    const cognomePulito = lastName.trim();
    const emailNormalizzata = email.toLowerCase().trim();

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
      if (eta < MIN_REGISTER_AGE) {
        return res.status(400).json({ error: `Devi avere almeno ${MIN_REGISTER_AGE} anni per registrarti` });
      }
    }

    // In questo controllo blocco in anticipo duplicati evidenti per dare un messaggio chiaro all'utente.
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

    const password_hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const colors = ["#00B4A0", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FECA57", "#DDA0DD"];
    const avatar_color = colors[Math.floor(Math.random() * colors.length)];

    // Racchiudo creazione utente e badge di benvenuto in una transazione.
    const conn = await pool.getConnection();
    let nuovoUtenteId;
    try {
      await conn.beginTransaction();
      const [insertResult] = await conn.query(
        `INSERT INTO users (first_name, last_name, email, password_hash, birth_date, avatar_color)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [nomePulito, cognomePulito, emailNormalizzata, password_hash, birthDate || null, avatar_color]
      );
      nuovoUtenteId = insertResult.insertId;

      await conn.query(
        `INSERT IGNORE INTO achievements (user_id, badge_type) VALUES (?, 'benvenuto')`,
        [nuovoUtenteId]
      );
      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }

    const utente = { id: nuovoUtenteId, email: emailNormalizzata, first_name: nomePulito };
    const token = generateToken(utente);

    res.status(201).json({ user: utente, token });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email già registrata" });
    }
    console.error(err);
    res.status(500).json({ error: "Errore interno" });
  }
  }
);

router.post(
  "/login",
  [
    body("email").trim().notEmpty().withMessage("Email e password sono obbligatorie").isEmail().withMessage("Email non valida"),
    body("password").notEmpty().withMessage("Email e password sono obbligatorie"),
  ],
  validateRequest,
  async (req, res) => {
  // In questa rotta verifico credenziali e restituisco token JWT per la sessione client.
  try {
    const { email, password } = req.body;

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
  }
);

router.post("/logout", (_req, res) => {
  // In questa rotta confermo il logout lato API; la revoca sessione resta lato client.
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
