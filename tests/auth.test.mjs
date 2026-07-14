import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { authenticateCredentials, createSession, readSession, sessionCookie, verifyCredentials } from "../lib/server-auth.js";

test("valida senha com scrypt e rejeita senha incorreta", () => {
  const salt = "00112233445566778899aabbccddeeff";
  process.env.ANALYTICS_LOGIN_USER = "admin";
  process.env.ANALYTICS_LOGIN_PASSWORD_HASH = `${salt}:${crypto.scryptSync("senha-forte", salt, 64).toString("hex")}`;
  assert.equal(verifyCredentials("admin", "senha-forte"), true);
  assert.equal(verifyCredentials("admin", "errada"), false);
});

test("cria sessão assinada e bloqueia cookie adulterado", () => {
  process.env.ANALYTICS_SESSION_SECRET = "segredo-de-teste-comprido-e-isolado";
  const token = createSession("admin");
  const cookie = sessionCookie(token).split(";")[0];
  assert.equal(readSession({ headers: { cookie } })?.user, "admin");
  assert.equal(readSession({ headers: { cookie: `${cookie}x` } }), null);
});

test("autentica múltiplos usuários e preserva o escopo no cookie", () => {
  const salt = "ffeeddccbbaa99887766554433221100";
  const passwordHash = `${salt}:${crypto.scryptSync("senha-huesller", salt, 64).toString("hex")}`;
  process.env.ANALYTICS_USERS_JSON = JSON.stringify([{ username: "huesller", displayName: "Huesller", role: "consultant", consultants: ["huesller"], passwordHash }]);
  const profile = authenticateCredentials("HUESLLER", "senha-huesller");
  assert.deepEqual(profile, { username: "huesller", displayName: "Huesller", role: "consultant", consultants: ["huesller"] });
  const cookie = sessionCookie(createSession(profile)).split(";")[0];
  assert.deepEqual(readSession({ headers: { cookie } })?.profile, profile);
  delete process.env.ANALYTICS_USERS_JSON;
});
