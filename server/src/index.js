import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDb } from "./lib/db.js";
import authRouter from "./routes/auth.js";
import profileRouter from "./routes/profile.js";
import moodsRouter from "./routes/moods.js";
import journalRouter from "./routes/journal.js";
import goalsRouter from "./routes/goals.js";
import achievementsRouter from "./routes/achievements.js";
import communityRouter from "./routes/community.js";
import chatbotRouter from "./routes/chatbot.js";

dotenv.config();

// In questo file preparo l'app Express e monto tutte le API sotto /api.
const app = express();
const PORT = process.env.PORT || 4000;
const originiConsentite = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((voce) => voce.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origine, callback) => {
      // Permetto richieste senza origin (es. Postman/curl) e quelle presenti in whitelist.
      if (!origine || originiConsentite.includes(origine)) {
        callback(null, true);
      } else {
        callback(new Error("Origine CORS non consentita"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "MindWell" });
});

app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/moods", moodsRouter);
app.use("/api/journal", journalRouter);
app.use("/api/goals", goalsRouter);
app.use("/api/achievements", achievementsRouter);
app.use("/api/community", communityRouter);
app.use("/api/chatbot", chatbotRouter);

initDb()
  .then(() => {
    // Avvio il server solo dopo init DB riuscita, per evitare errori runtime su tabelle mancanti.
    app.listen(PORT, () => {
      console.log(`MindWell server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err.message);
    console.error("Make sure MySQL is running and the database 'mindwell' exists.");
    console.error("Create it with: CREATE DATABASE mindwell;");
    process.exit(1);
  });
