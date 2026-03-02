import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import authRouter from "../src/routes/auth.js";

test("POST /api/auth/logout restituisce conferma logout", async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRouter);

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(data, { message: "Logout effettuato" });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});
