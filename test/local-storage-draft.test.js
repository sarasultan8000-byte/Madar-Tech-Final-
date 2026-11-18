import assert from "node:assert/strict";
import test from "node:test";
import { loadDraft, saveDraft } from "../js/draft-adapter.js";

test("dashboard stores the JSON draft locally and imports the server draft only once", async () => {
    const values = new Map();
    const fetchCalls = [];
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
    globalThis.fetch = async (url, options) => {
        fetchCalls.push({ url, method: options.method });
        return new Response(JSON.stringify({
            draft: {
                sections: [{ id: "about", title: "Imported title", visible: true }],
                settings: { siteName: "Imported site" }
            }
        }), { status: 200, headers: { "Content-Type": "application/json" } });
    };

    try {
        const imported = await loadDraft();
        assert.equal(imported.sections[0].title, "Imported title");
        assert.equal(fetchCalls.length, 1);
        assert.equal(fetchCalls[0].method, "GET");

        const updated = {
            ...imported,
            sections: [{ ...imported.sections[0], title: "Saved locally" }]
        };
        await saveDraft(updated);

        const serialized = values.get("madar-tech-dashboard-draft");
        assert.equal(typeof serialized, "string");
        assert.equal(JSON.parse(serialized).sections[0].title, "Saved locally");
        assert.equal(fetchCalls.length, 1, "saving after import should not send another API request");

        const reloaded = await loadDraft();
        assert.equal(reloaded.sections[0].title, "Saved locally");
        assert.equal(fetchCalls.length, 1, "a local draft should load without contacting the server");
    } finally {
        if (originalLocalStorageDescriptor) {
            Object.defineProperty(globalThis, "localStorage", originalLocalStorageDescriptor);
        } else {
            delete globalThis.localStorage;
        }
        globalThis.fetch = originalFetch;
    }
});
