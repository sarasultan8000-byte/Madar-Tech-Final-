import { randomBytes, scryptSync } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(path.dirname(fileURLToPath(import.meta.url))), "../..");
const envPath = path.join(root, ".env");
const resetting = process.argv.includes("--reset");

if (existsSync(envPath) && !resetting) {
    console.error("ملف .env موجود. استخدم npm run reset-admin لإنشاء كلمة مرور جديدة.");
    process.exitCode = 1;
} else {
    const password = randomBytes(24).toString("base64url");
    const salt = randomBytes(16);
    const hash = scryptSync(password, salt, 64);
    const contents = [
        `ADMIN_PASSWORD_SALT=${salt.toString("hex")}`,
        `ADMIN_PASSWORD_HASH=${hash.toString("hex")}`,
        "HOST=127.0.0.1",
        "PORT=3000",
        ""
    ].join("\n");

    writeFileSync(envPath, contents, { mode: 0o600 });
    console.log("تم إعداد بيانات الدخول.");
    console.log(`كلمة مرور لوحة التحكم (احفظها الآن): ${password}`);
    console.log("ابدأ الخادم باستخدام: npm start");
}
