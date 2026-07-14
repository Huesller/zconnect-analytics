import crypto from "node:crypto";

export const SESSION_COOKIE = "zconnect_analytics_session";
const SESSION_DURATION_SECONDS = 12 * 60 * 60;

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function sessionSecret() {
  return String(process.env.ANALYTICS_SESSION_SECRET || "").trim();
}

function parseCookies(req) {
  return String(req.headers.cookie || "").split(";").reduce((cookies, part) => {
    const index = part.indexOf("=");
    if (index < 0) return cookies;
    cookies[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
    return cookies;
  }, {});
}

function sign(value) {
  return crypto.createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function normalizeAliases(values) {
  const source = Array.isArray(values) ? values : String(values || "").split(",");
  return [...new Set(source.map((value) => String(value || "").trim().toLowerCase()).filter(Boolean))];
}

function publicProfile(user) {
  return {
    username: String(user.username || user.user || "").trim().toLowerCase(),
    displayName: String(user.displayName || user.name || user.username || "Usuário").trim(),
    role: String(user.role || "consultant").trim().toLowerCase(),
    consultants: normalizeAliases(user.consultants || user.consultant)
  };
}

function configuredUsers() {
  const raw = String(process.env.ANALYTICS_USERS_JSON || "").trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed?.users)) return parsed.users;
    } catch {
      return [];
    }
  }

  const username = String(process.env.ANALYTICS_LOGIN_USER || "").trim();
  if (!username) return [];
  return [{
    username,
    displayName: process.env.ANALYTICS_LOGIN_NAME || "Administrador",
    role: "admin",
    consultants: ["*"],
    passwordHash: process.env.ANALYTICS_LOGIN_PASSWORD_HASH,
    password: process.env.ANALYTICS_LOGIN_PASSWORD
  }];
}

function verifyPassword(password, user) {
  const passwordHash = String(user.passwordHash || user.hash || "").trim();
  if (passwordHash) {
    const [salt, expected] = passwordHash.split(":");
    if (!salt || !expected) return false;
    const actual = crypto.scryptSync(String(password || ""), salt, 64).toString("hex");
    return safeEqual(actual, expected);
  }
  const configuredPassword = String(user.password || "");
  return Boolean(configuredPassword && safeEqual(String(password || ""), configuredPassword));
}

export function createSession(user) {
  const profile = typeof user === "string" ? { username: user, displayName: user, role: "admin", consultants: ["*"] } : publicProfile(user);
  const payload = Buffer.from(JSON.stringify({
    user: profile.username,
    profile,
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
    version: 2
  })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readSession(req) {
  const secret = sessionSecret();
  if (!secret) return null;
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!parsed.user || Number(parsed.exp || 0) <= Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function sessionCookie(token) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DURATION_SECONDS}`;
}

export function expiredSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function authenticateCredentials(username, password) {
  const requested = String(username || "").trim().toLowerCase();
  const user = configuredUsers().find((item) => String(item.username || item.user || "").trim().toLowerCase() === requested && item.active !== false);
  if (!user || !verifyPassword(password, user)) return null;
  return publicProfile(user);
}

export function verifyCredentials(user, password) {
  return Boolean(authenticateCredentials(user, password));
}

export function json(res, status, body) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  return res.status(status).json(body);
}

export function requireSession(req, res) {
  const session = readSession(req);
  if (!session) {
    json(res, 401, { ok: false, error: "unauthorized" });
    return null;
  }
  return session;
}
