import test from "node:test";
import assert from "node:assert/strict";
import { authRequired, generateToken } from "../src/middleware/auth.js";

function createResMock() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test("generateToken crea un JWT valido con i campi utente", () => {
  const user = { id: 42, email: "test@example.com", first_name: "Chiara" };
  const token = generateToken(user);
  assert.ok(typeof token === "string" && token.length > 20);
});

test("authRequired rifiuta richieste senza bearer token", () => {
  const req = { headers: {} };
  const res = createResMock();
  let nextCalled = false;

  authRequired(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Token mancante" });
});

test("authRequired accetta richieste con token valido", () => {
  const token = generateToken({
    id: 7,
    email: "user@example.com",
    first_name: "User",
  });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = createResMock();
  let nextCalled = false;

  authRequired(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.user.id, 7);
  assert.equal(req.user.email, "user@example.com");
  assert.equal(req.user.first_name, "User");
});
