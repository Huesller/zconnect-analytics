import crypto from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error("Uso: node scripts/generate-auth-secrets.mjs SUA_SENHA");
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString("hex");
const hash = crypto.scryptSync(password, salt, 64).toString("hex");
console.log(`ANALYTICS_LOGIN_PASSWORD_HASH=${salt}:${hash}`);
console.log(`ANALYTICS_SESSION_SECRET=${crypto.randomBytes(48).toString("hex")}`);
console.log(`ANALYTICS_ADMIN_TOKEN=${crypto.randomBytes(48).toString("hex")}`);
console.log(`CATALOG_SYNC_TOKEN=${crypto.randomBytes(48).toString("hex")}`);
