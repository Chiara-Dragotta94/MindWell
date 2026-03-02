import jwt from "jsonwebtoken";
import { JWT_EXPIRES_IN } from "../config/constants.js";

const JWT_SECRET = process.env.JWT_SECRET || "unobravo-wellness-secret-key";

export function generateToken(user) {
  // In questa funzione firmo il token includendo solo i dati minimi utili alle rotte protette.
  return jwt.sign(
    { id: user.id, email: user.email, first_name: user.first_name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function authRequired(req, res, next) {
  // In questo middleware proteggo le API: senza Bearer token valido blocco subito la richiesta.
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token mancante" });
  }
  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Token non valido o scaduto" });
  }
}
