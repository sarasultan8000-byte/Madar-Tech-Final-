import assert from "node:assert/strict";
import test from "node:test";
import { loadDraft, saveDraft } from "../dashboard/js/draft-adapter.js";

function installBrowserStorage(values) {
    const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    const originalFetch = globalThis.fetch;
    Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        writable: true,
        value: {
            getItem(key) {
                return values.has(key) ? values.get(key) : null;
            },
            setItem(key, value) {
                values.set(key, String(value));
            }
        }
    });
    return () => {
        if (originalLocalStorageDescriptor) {
            Object.defineProperty(globalThis, "localStorage", originalLocalStorageDescriptor);
        } else {
            delete globalThis.localStorage;
        }
        globalThis.fetch = originalFetch;
    };
}

test("dashboard reads and saves the shared server draft instead of local browser data", async () => {
    const localDraft = { sections: [{ id: "about", title: "Device-only title", visible: true }] };
    const values = new Map([["madar-tech-homepage-v1", JSON.stringify(localDraft)]]);
    const requests = [];
    const restoreBrowserStorage = installBrowserStorage(values);
    globalThis.fetch = async (url, options) => {
        const request = { url, method: options.method, body: options.body && JSON.parse(options.body) };
        requests.push(request);
        const draft = options.method === "GET"
            ? { sections: [{ id: "about", title: "Shared title", visible: true }] }
            : request.body;
        return new Response(JSON.stringify({ draft, updatedAt: "2026-01-01T00:00:00.000Z" }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    };

    try {
        const imported = await loadDraft();
        assert.equal(imported.sections[0].title, "Shared title");
        assert.equal(JSON.parse(values.get("madar-tech-homepage-v1")).sections[0].title, "Device-only title");

        const updated = {
            ...imported,
            sections: [{ ...imported.sections[0], title: "Saved to database" }]
        };
        await saveDraft(updated);

        assert.deepEqual(requests.map(({ method }) => method), ["GET", "PUT"]);
        assert.equal(requests[1].url, "/api/draft");
        assert.equal(requests[1].body.sections[0].title, "Saved to database");
    } finally {
        restoreBrowserStorage();
    }
});

test("dashboard imports an old local draft into an empty database without deleting the local copy", async () => {
    const oldDraft = { sections: [{ id: "about", title: "Existing title", visible: true }] };
    const legacySerialized = JSON.stringify(oldDraft);
    const values = new Map([["madar-tech-dashboard-draft", legacySerialized]]);
    const requests = [];
    const restoreBrowserStorage = installBrowserStorage(values);
    globalThis.fetch = async (url, options) => {
        requests.push({ url, method: options.method, body: options.body && JSON.parse(options.body) });
        const draft = options.method === "GET" ? null : JSON.parse(options.body);
        return new Response(JSON.stringify({ draft, updatedAt: draft ? "2026-01-01T00:00:00.000Z" : null }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    };

    try {
        const draft = await loadDraft();
        assert.equal(draft.sections[0].title, "Existing title");
        assert.deepEqual(requests.map(({ method }) => method), ["GET", "POST"]);
        assert.equal(requests[1].body.sections[0].title, "Existing title");
        assert.equal(values.get("madar-tech-dashboard-draft"), legacySerialized);
    } finally {
        restoreBrowserStorage();
    }
});
