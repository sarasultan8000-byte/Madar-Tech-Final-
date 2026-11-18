import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { scryptSync } from "node:crypto";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const serverPath = path.join(root, "server.js");
const setupPath = path.join(root, "scripts", "setup.js");
const password = "madar-test-password-not-for-production";
const passwordSalt = Buffer.from("4f0e2ba20fa2b8a47a57e78fb7831d02", "hex");
const passwordHash = scryptSync(password, passwordSalt, 64).toString("hex");

async function unusedPort() {
    const probe = net.createServer();
    await new Promise((resolve, reject) => {
        probe.once("error", reject);
        probe.listen(0, "127.0.0.1", resolve);
    });
    const { port } = probe.address();
    await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()));
    return port;
}

async function startServer(dataDirectory) {
    const port = await unusedPort();
    const child = spawn(process.execPath, [serverPath], {
        cwd: root,
        env: {
            ...process.env,
            HOST: "127.0.0.1",
            PORT: String(port),
            DATA_DIR: dataDirectory,
            ADMIN_PASSWORD_SALT: passwordSalt.toString("hex"),
            ADMIN_PASSWORD_HASH: passwordHash
        },
        stdio: ["ignore", "pipe", "pipe"]
    });
    let output = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => { output += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk) => { output += chunk; });

    const baseUrl = `http://127.0.0.1:${port}`;
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
        if (child.exitCode !== null) throw new Error(`Server exited during startup: ${output}`);
        try {
            const response = await fetch(`${baseUrl}/api/health`);
            if (response.ok) return { child, baseUrl, output: () => output };
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }
    child.kill();
    throw new Error(`Server did not start in time: ${output}`);
}

async function stopServer(child) {
    if (child.exitCode !== null) return;
    const exited = new Promise((resolve) => child.once("exit", resolve));
    child.kill();
    await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 5000))]);
    if (child.exitCode === null) child.kill("SIGKILL");
}

async function login(baseUrl) {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: baseUrl },
        body: JSON.stringify({ password })
    });
    assert.equal(response.status, 200);
    const cookie = response.headers.get("set-cookie")?.split(";")[0];
    assert.ok(cookie, "login should issue a session cookie");
    return cookie;
}

test("setup creates a verifiable admin password and requires explicit reset", () => {
    const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), "madar-tech-setup-test-"));
    try {
        const scriptsDirectory = path.join(temporaryRoot, "scripts");
        mkdirSync(scriptsDirectory);
        const temporarySetup = path.join(scriptsDirectory, "setup.js");
        copyFileSync(setupPath, temporarySetup);
        const envPath = path.join(temporaryRoot, ".env");

        const firstRun = spawnSync(process.execPath, [temporarySetup], { encoding: "utf8" });
        assert.equal(firstRun.status, 0, firstRun.stderr);
        const firstContents = readFileSync(envPath, "utf8");
        const firstPassword = firstRun.stdout.match(/كلمة مرور لوحة التحكم \(احفظها الآن\): ([\w-]+)/)?.[1];
        assert.ok(firstPassword);
        const firstSalt = firstContents.match(/^ADMIN_PASSWORD_SALT=([\da-f]+)$/m)?.[1];
        const firstHash = firstContents.match(/^ADMIN_PASSWORD_HASH=([\da-f]+)$/m)?.[1];
        assert.equal(scryptSync(firstPassword, Buffer.from(firstSalt, "hex"), 64).toString("hex"), firstHash);

        const secondRun = spawnSync(process.execPath, [temporarySetup], { encoding: "utf8" });
        assert.equal(secondRun.status, 1);
        assert.equal(readFileSync(envPath, "utf8"), firstContents);

        const resetRun = spawnSync(process.execPath, [temporarySetup, "--reset"], { encoding: "utf8" });
        assert.equal(resetRun.status, 0, resetRun.stderr);
        const resetPassword = resetRun.stdout.match(/كلمة مرور لوحة التحكم \(احفظها الآن\): ([\w-]+)/)?.[1];
        assert.ok(resetPassword);
        assert.notEqual(resetPassword, firstPassword);
    } finally {
        rmSync(temporaryRoot, { recursive: true, force: true });
    }
});

test("the protected draft API accepts PUT and persists data across server restarts", async () => {
    const dataDirectory = mkdtempSync(path.join(os.tmpdir(), "madar-tech-persistence-"));
    let child;
    try {
        let server = await startServer(dataDirectory);
        child = server.child;
        const { baseUrl } = server;

        assert.equal((await fetch(`${baseUrl}/api/draft`)).status, 401);

        const crossOriginLogin = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Origin: "https://attacker.example" },
            body: JSON.stringify({ password })
        });
        assert.equal(crossOriginLogin.status, 403);

        const invalidLogin = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Origin: baseUrl },
            body: JSON.stringify({ password: "wrong-password" })
        });
        assert.equal(invalidLogin.status, 401);

        const cookie = await login(baseUrl);
        const initialRead = await fetch(`${baseUrl}/api/draft`, { headers: { Cookie: cookie } });
        assert.equal(initialRead.status, 200);
        assert.deepEqual(await initialRead.json(), { draft: null, updatedAt: null });

        const draft = {
            version: 2,
            sections: [{ id: "about", title: "Madar Tech", visible: false, order: 1 }],
            settings: { siteName: "Persistent Madar Tech" }
        };
        const save = await fetch(`${baseUrl}/api/draft`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Cookie: cookie, Origin: baseUrl },
            body: JSON.stringify(draft)
        });
        assert.equal(save.status, 200);
        const savedBody = await save.json();
        assert.deepEqual(savedBody.draft, draft);
        assert.ok(savedBody.updatedAt);

        const unsupportedMethod = await fetch(`${baseUrl}/api/draft`, {
            method: "POST",
            headers: { Cookie: cookie, Origin: baseUrl }
        });
        assert.equal(unsupportedMethod.status, 405);
        assert.equal(unsupportedMethod.headers.get("allow"), "GET, PUT");
        assert.equal((await fetch(`${baseUrl}/data/madar-tech.sqlite`)).status, 404);

        await stopServer(child);
        child = null;
        server = await startServer(dataDirectory);
        child = server.child;

        const newCookie = await login(server.baseUrl);
        const reload = await fetch(`${server.baseUrl}/api/draft`, { headers: { Cookie: newCookie } });
        assert.equal(reload.status, 200);
        assert.deepEqual((await reload.json()).draft, draft);

        const logout = await fetch(`${server.baseUrl}/api/auth/logout`, {
            method: "POST",
            headers: { Cookie: newCookie, Origin: server.baseUrl }
        });
        assert.equal(logout.status, 204);
        assert.equal((await fetch(`${server.baseUrl}/api/draft`, { headers: { Cookie: newCookie } })).status, 401);
    } finally {
        if (child) await stopServer(child);
        rmSync(dataDirectory, { recursive: true, force: true });
    }
});
