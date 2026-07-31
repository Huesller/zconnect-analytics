import crypto from "node:crypto";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const USERS = [
  { username: "admin", displayName: "Administrador", role: "admin", consultants: ["*"] },
  { username: "huesller", displayName: "Huesller", role: "consultant", consultants: ["huesller"] },
  { username: "ney", displayName: "Ney", role: "consultant", consultants: ["ney", "ivoney"] },
  { username: "almir", displayName: "Almir", role: "consultant", consultants: ["almir"] },
  { username: "gabriel", displayName: "Gabriel Zatt", role: "consultant", consultants: ["gabriel", "gabriel-zatt"] },
  { username: "junior", displayName: "Junior", role: "consultant", consultants: ["junior"] },
  { username: "francisco", displayName: "Francisco", role: "representative", consultants: ["francisco", "representante"] }
];

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}

const rl = readline.createInterface({ input, output });
const configured = [];
console.log("Digite uma senha temporária forte para cada usuário. O resultado armazenará somente hashes.");
for (const user of USERS) {
  let password = "";
  while (password.length < 8) {
    password = await rl.question(`Senha de ${user.displayName} (mínimo 8 caracteres): `);
    if (password.length < 8) console.log("Senha muito curta.");
  }
  configured.push({ ...user, active: true, passwordHash: hashPassword(password) });
}
rl.close();

console.log("\nCrie esta variável sensível na Vercel:");
console.log(`ANALYTICS_USERS_JSON=${JSON.stringify(configured)}`);
