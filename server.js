import "dotenv/config";
import express from "express";
import Database from "better-sqlite3";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT) || 3000;
const sessionLifetimeMs = 8 * 60 * 60 * 1000;
const sessionCookie = "madar_session";
const passwordSaltText = process.env.ADMIN_PASSWORD_SALT || "";
const passwordHashText = process.env.ADMIN_PASSWORD_HASH || "";

if (!/^[\da-f]{32}$/i.test(passwordSaltText) || !/^[\da-f]{128}$/i.test(passwordHashText)) {
    console.error("بيانات الدخول غير مهيأة. شغّل npm run setup أولاً.");
    process.exit(1);
}

const passwordSalt = Buffer.from(passwordSaltText, "hex");
const expectedPasswordHash = Buffer.from(passwordHashText, "hex");
const dataDirectory = path.resolve(process.env.DATA_DIR || path.join(root, "data"));
const databasePath = path.resolve(process.env.DATABASE_PATH || path.join(dataDirectory, "madar-tech.sqlite"));
mkdirSync(path.dirname(databasePath), { recursive: true });

const database = new Database(databasePath);
database.pragma("journal_mode = WAL");
database.pragma("busy_timeout = 5000");
database.exec(`
    CREATE TABLE IF NOT EXISTS drafts (
        id TEXT PRIMARY KEY CHECK (id = 'main'),
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
`);
const readDraft = database.prepare("SELECT payload, updated_at FROM drafts WHERE id = 'main'");
const writeDraft = database.prepare(`
    INSERT INTO drafts (id, payload, updated_at)
    VALUES ('main', ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    ON CONFLICT(id) DO UPDATE SET
        payload = excluded.payload,
        updated_at = excluded.updated_at
`);

const sessions = new Map();
const loginAttempts = new Map();
const app = express();
app.disable("x-powered-by");
app.use((request, response, next) => {
    response.set("X-Content-Type-Options", "nosniff");
    response.set("Referrer-Policy", "same-origin");
    response.set("X-Frame-Options", "SAMEORIGIN");
    next();
});
app.use("/api", express.json({ limit: "2mb", strict: true }));

function sameOrigin(request, response, next) {
    const origin = request.get("origin");
    let parsedOrigin;
    try {
        parsedOrigin = origin ? new URL(origin) : null;
    } catch {
        parsedOrigin = null;
    }
    if (!parsedOrigin || !["http:", "https:"].includes(parsedOrigin.protocol) || parsedOrigin.host !== request.get("host")) {
        return response.status(403).json({ error: "يُسمح بالطلبات من نفس الموقع فقط." });
    }
    next();
}

function readSessionToken(request) {
    const cookieHeader = request.get("cookie") || "";
    for (const part of cookieHeader.split(";")) {
        const [name, ...valueParts] = part.trim().split("=");
        if (name === sessionCookie) return valueParts.join("=");
    }
    return "";
}

function requireSession(request, response, next) {
    const token = readSessionToken(request);
    const expiresAt = sessions.get(token);
    if (!token || !expiresAt || expiresAt <= Date.now()) {
        if (token) sessions.delete(token);
        return response.status(401).json({ error: "يلزم تسجيل الدخول للوصول إلى المسودة." });
    }
    next();
}

function setSessionCookie(response, token, maxAgeSeconds) {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    response.setHeader(
        "Set-Cookie",
        `${sessionCookie}=${token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${maxAgeSeconds}${secure}`
    );
}

function attemptKey(request) {
    return request.ip || request.socket.remoteAddress || "unknown";
}

function recordFailedLogin(request) {
    const now = Date.now();
    const key = attemptKey(request);
    const current = loginAttempts.get(key);
    const attempts = !current || current.resetAt <= now ? { count: 0, resetAt: now + 15 * 60 * 1000 } : current;
    attempts.count += 1;
    loginAttempts.set(key, attempts);
}

function draftFromRequest(body) {
    const draft = body && typeof body === "object" && !Array.isArray(body) && body.draft
        ? body.draft
        : body;
    if (!draft || typeof draft !== "object" || Array.isArray(draft)) {
        return { error: "يجب إرسال المسودة ككائن JSON." };
    }
    if (draft.sections !== undefined && !Array.isArray(draft.sections)) {
        return { error: "حقل sections يجب أن يكون قائمة." };
    }
    if (draft.settings !== undefined && (!draft.settings || typeof draft.settings !== "object" || Array.isArray(draft.settings))) {
        return { error: "حقل settings يجب أن يكون كائناً." };
    }
    const collections = ["pages", "services", "projects", "teamMembers", "testimonials", "faq", "messages"];
    for (const key of collections) {
        if (draft[key] !== undefined && !Array.isArray(draft[key])) {
            return { error: `حقل ${key} يجب أن يكون قائمة.` };
        }
    }
    return { draft };
}

app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
});

app.post("/api/auth/login", sameOrigin, (request, response) => {
    const now = Date.now();
    for (const [key, attempt] of loginAttempts) {
        if (attempt.resetAt <= now) loginAttempts.delete(key);
    }
    const attempts = loginAttempts.get(attemptKey(request));
    if (attempts && attempts.count >= 10 && attempts.resetAt > now) {
        return response.status(429).json({ error: "محاولات كثيرة. انتظر قليلاً ثم حاول مجدداً." });
    }

    const password = request.body && request.body.password;
    if (typeof password !== "string" || password.length > 256) {
        recordFailedLogin(request);
        return response.status(401).json({ error: "بيانات الدخول غير صحيحة." });
    }
    const candidateHash = scryptSync(password, passwordSalt, expectedPasswordHash.length);
    if (!timingSafeEqual(candidateHash, expectedPasswordHash)) {
        recordFailedLogin(request);
        return response.status(401).json({ error: "بيانات الدخول غير صحيحة." });
    }

    loginAttempts.delete(attemptKey(request));
    const token = randomBytes(32).toString("base64url");
    sessions.set(token, now + sessionLifetimeMs);
    setSessionCookie(response, token, sessionLifetimeMs / 1000);
    response.json({ authenticated: true });
});

app.post("/api/auth/logout", sameOrigin, (request, response) => {
    sessions.delete(readSessionToken(request));
    setSessionCookie(response, "", 0);
    response.status(204).end();
});

app.get("/api/draft", requireSession, (_request, response) => {
    const row = readDraft.get();
    if (!row) return response.json({ draft: null, updatedAt: null });
    let draft;
    try {
        draft = JSON.parse(row.payload);
    } catch (error) {
        console.error("Stored draft is not valid JSON.", error);
        return response.status(500).json({ error: "تعذّر قراءة المسودة المحفوظة." });
    }
    response.json({ draft, updatedAt: row.updated_at });
});

app.put("/api/draft", sameOrigin, requireSession, (request, response) => {
    const result = draftFromRequest(request.body);
    if (result.error) return response.status(400).json({ error: result.error });

    const payload = JSON.stringify(result.draft);
    if (Buffer.byteLength(payload, "utf8") > 2 * 1024 * 1024) {
        return response.status(413).json({ error: "حجم المسودة أكبر من الحد المسموح (2 ميغابايت)." });
    }
    writeDraft.run(payload);
    const saved = readDraft.get();
    response.json({ draft: result.draft, updatedAt: saved.updated_at });
});

app.all("/api/draft", (_request, response) => {
    response.set("Allow", "GET, PUT");
    response.status(405).json({ error: "الطريقة غير مدعومة لهذا المسار. استخدم GET أو PUT." });
});
app.use("/api", (_request, response) => {
    response.status(404).json({ error: "مسار API غير موجود." });
});

app.get(["/", "/index.html"], (_request, response) => response.sendFile(path.join(root, "index.html")));
app.get("/dashboard.html", (_request, response) => response.sendFile(path.join(root, "dashboard.html")));
app.use("/css", express.static(path.join(root, "css"), { dotfiles: "deny", fallthrough: false }));
app.use("/js", express.static(path.join(root, "js"), { dotfiles: "deny", fallthrough: false }));
app.use("/images", express.static(path.join(root, "images"), { dotfiles: "deny", fallthrough: false }));
app.use((_request, response) => response.status(404).send("Not found."));

app.use((error, request, response, _next) => {
    const status = Number(error.status || error.statusCode) || 500;
    if (status >= 500) console.error("Request failed.", error);
    if (response.headersSent) return;
    const message = status === 400
        ? "الطلب غير صالح. تحقق من تنسيق JSON."
        : status === 413
            ? "حجم الطلب أكبر من الحد المسموح."
            : status >= 500
                ? "حدث خطأ داخلي. راجع سجل الخادم."
                : "تعذّر تنفيذ الطلب.";
    response.status(status).json({ error: message });
});

const sessionCleanup = setInterval(() => {
    const now = Date.now();
    for (const [token, expiresAt] of sessions) {
        if (expiresAt <= now) sessions.delete(token);
    }
}, 60 * 60 * 1000);
sessionCleanup.unref();

const server = app.listen(port, host, () => {
    console.log(`Madar Tech server running at http://${host}:${port}`);
    console.log(`SQLite database: ${databasePath}`);
});

function shutdown() {
    clearInterval(sessionCleanup);
    server.close(() => {
        database.close();
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000).unref();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
