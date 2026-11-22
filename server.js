import "dotenv/config";
import express from "express";
import Database from "better-sqlite3";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT) || 3000;
const maxDraftBytes = 2 * 1024 * 1024;
const editableCollections = new Set(["sections", "pages", "services", "projects", "teamMembers", "testimonials", "faq", "messages"]);
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

function getStoredDraft() {
    const row = readDraft.get();
    if (!row) return { draft: null, updatedAt: null };
    try {
        return { draft: JSON.parse(row.payload), updatedAt: row.updated_at };
    } catch (error) {
        console.error("Stored draft is not valid JSON.", error);
        const invalidDraftError = new Error("تعذّر قراءة المسودة المحفوظة.");
        invalidDraftError.statusCode = 500;
        throw invalidDraftError;
    }
}

function publicDraft(draft) {
    if (!draft) return null;
    const hiddenStatuses = new Set(["hidden", "draft", "inactive", "unpublished"]);
    const publicContent = {};
    for (const collection of ["sections", "services", "projects", "teamMembers", "testimonials", "faq"]) {
        if (Array.isArray(draft[collection])) {
            publicContent[collection] = draft[collection].filter((item) => {
                if (!item || typeof item !== "object" || item.visible === false) return false;
                return typeof item.status !== "string" || !hiddenStatuses.has(item.status.toLowerCase());
            });
        }
    }
    if (draft.settings && typeof draft.settings === "object") {
        const publicSettings = {};
        for (const key of ["siteName", "siteNameEn", "siteDescription", "siteDescriptionEn", "contactEmail", "contactPhone", "location", "locationEn"]) {
            if (Object.hasOwn(draft.settings, key)) publicSettings[key] = draft.settings[key];
        }
        publicContent.settings = publicSettings;
    }
    return publicContent;
}

function persistDraft(draft) {
    const payload = JSON.stringify(draft);
    if (Buffer.byteLength(payload, "utf8") > maxDraftBytes) {
        const sizeError = new Error("حجم المسودة أكبر من الحد المسموح (2 ميغابايت).");
        sizeError.statusCode = 413;
        throw sizeError;
    }
    writeDraft.run(payload);
    return getStoredDraft();
}

const createDraftIfEmpty = database.transaction((draft) => {
    const existing = readDraft.get();
    if (existing) return { ...getStoredDraft(), created: false };
    const saved = persistDraft(draft);
    return { ...saved, created: true };
});

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

app.get("/api/site", (_request, response, next) => {
    try {
        response.set("Cache-Control", "no-store");
        const { draft, updatedAt } = getStoredDraft();
        response.json({ draft: publicDraft(draft), updatedAt });
    } catch (error) {
        next(error);
    }
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

app.get("/api/draft", requireSession, (_request, response, next) => {
    try {
        response.set("Cache-Control", "no-store");
        response.json(getStoredDraft());
    } catch (error) {
        next(error);
    }
});

app.put("/api/draft", sameOrigin, requireSession, (request, response, next) => {
    const result = draftFromRequest(request.body);
    if (result.error) return response.status(400).json({ error: result.error });
    try {
        response.json(persistDraft(result.draft));
    } catch (error) {
        next(error);
    }
});

app.post("/api/draft", sameOrigin, requireSession, (request, response, next) => {
    const result = draftFromRequest(request.body);
    if (result.error) return response.status(400).json({ error: result.error });
    try {
        const saved = createDraftIfEmpty(result.draft);
        response.status(saved.created ? 201 : 200).json(saved);
    } catch (error) {
        next(error);
    }
});

function validCollection(request, response, next) {
    if (!editableCollections.has(request.params.collection)) {
        return response.status(404).json({ error: "مجموعة المحتوى غير موجودة." });
    }
    next();
}

const updateCollection = database.transaction((collection, mutate) => {
    const stored = getStoredDraft();
    const draft = stored.draft || {};
    const items = Array.isArray(draft[collection]) ? draft[collection] : [];
    const result = mutate(items);
    if (result === null) return null;
    draft[collection] = result.items;
    const saved = persistDraft(draft);
    return { item: result.item, items: result.items, updatedAt: saved.updatedAt };
});

app.get("/api/content/:collection", requireSession, validCollection, (request, response, next) => {
    try {
        const { draft, updatedAt } = getStoredDraft();
        response.set("Cache-Control", "no-store");
        response.json({ items: draft && Array.isArray(draft[request.params.collection]) ? draft[request.params.collection] : [], updatedAt });
    } catch (error) {
        next(error);
    }
});

app.get("/api/content/:collection/:id", requireSession, validCollection, (request, response, next) => {
    try {
        const { draft, updatedAt } = getStoredDraft();
        const items = draft && Array.isArray(draft[request.params.collection]) ? draft[request.params.collection] : [];
        const item = items.find((entry) => entry && entry.id === request.params.id);
        if (!item) return response.status(404).json({ error: "عنصر المحتوى غير موجود." });
        response.set("Cache-Control", "no-store");
        response.json({ item, updatedAt });
    } catch (error) {
        next(error);
    }
});

app.post("/api/content/:collection", sameOrigin, requireSession, validCollection, (request, response, next) => {
    const item = request.body;
    if (!item || typeof item !== "object" || Array.isArray(item)) {
        return response.status(400).json({ error: "يجب إرسال عنصر المحتوى ككائن JSON." });
    }
    const id = typeof item.id === "string" ? item.id.trim() : "";
    if (!id) return response.status(400).json({ error: "يجب أن يحتوي عنصر المحتوى على معرّف نصي." });
    try {
        const result = updateCollection(request.params.collection, (items) => {
            if (items.some((entry) => entry && entry.id === id)) return null;
            const created = { ...item, id };
            return { items: [...items, created], item: created };
        });
        if (!result) return response.status(409).json({ error: "يوجد عنصر بهذا المعرّف مسبقاً." });
        response.status(201).json(result);
    } catch (error) {
        next(error);
    }
});

app.put("/api/content/:collection/:id", sameOrigin, requireSession, validCollection, (request, response, next) => {
    const item = request.body;
    if (!item || typeof item !== "object" || Array.isArray(item)) {
        return response.status(400).json({ error: "يجب إرسال عنصر المحتوى ككائن JSON." });
    }
    try {
        const result = updateCollection(request.params.collection, (items) => {
            const index = items.findIndex((entry) => entry && entry.id === request.params.id);
            if (index < 0) return null;
            const updated = { ...item, id: request.params.id };
            const updatedItems = [...items];
            updatedItems[index] = updated;
            return { items: updatedItems, item: updated };
        });
        if (!result) return response.status(404).json({ error: "عنصر المحتوى غير موجود." });
        response.json(result);
    } catch (error) {
        next(error);
    }
});

app.delete("/api/content/:collection/:id", sameOrigin, requireSession, validCollection, (request, response, next) => {
    try {
        const result = updateCollection(request.params.collection, (items) => {
            const updatedItems = items.filter((entry) => !entry || entry.id !== request.params.id);
            if (updatedItems.length === items.length) return null;
            return { items: updatedItems, item: { id: request.params.id } };
        });
        if (!result) return response.status(404).json({ error: "عنصر المحتوى غير موجود." });
        response.json({ deleted: true, updatedAt: result.updatedAt });
    } catch (error) {
        next(error);
    }
});

app.all("/api/draft", (_request, response) => {
    response.set("Allow", "GET, POST, PUT");
    response.status(405).json({ error: "الطريقة غير مدعومة لهذا المسار. استخدم GET أو POST أو PUT." });
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
