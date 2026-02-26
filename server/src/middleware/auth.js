import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "unobravo-wellness-secret-key";

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, first_name: user.first_name },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
}

export function authRequired(req, res, next) {
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
