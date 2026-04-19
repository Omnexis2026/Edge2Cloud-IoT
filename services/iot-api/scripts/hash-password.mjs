import bcrypt from "bcryptjs";

const pwd = process.argv[2];
if (!pwd) {
  console.error("Usage: npm run hash-password -- <plain-password>");
  process.exit(1);
}

const hash = await bcrypt.hash(pwd, 12);
console.log("Set in .env as IOT_AUTH_PASSWORD_HASH=");
console.log(hash);
