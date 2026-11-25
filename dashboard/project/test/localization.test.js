import assert from "node:assert/strict";
import test from "node:test";
import { createEmptyDraft } from "../../../dashboard/js/draft-adapter.js";
import { renderPreview } from "../../../dashboard/js/preview-renderer.js";

test("the starter draft includes English content for its preview", () => {
    const preview = renderPreview(createEmptyDraft(), "en");

    assert.match(preview, /Training and development/);
    assert.match(preview, /What is Madar Tech\?/);
    assert.doesNotMatch(preview, /[\u0600-\u06FF]/);
});

test("English preview uses English CMS content and never falls back to Arabic", () => {
    const draft = {
        settings: { siteName: "ط§ط³ظ… ط§ظ„ظ…ظˆظ‚ط¹" },
        sections: [
            {
                id: "services", title: "ط§ظ„ط®ط¯ظ…ط§طھ", titleEn: "Services",
                description: "ظˆطµظپ ط¹ط±ط¨ظٹ", descriptionEn: "English description",
                sectionKey: "services", visible: true
            },
            { id: "untranslated", title: "ط¹ظ†ظˆط§ظ† ط¹ط±ط¨ظٹ", description: "ظˆطµظپ ط¹ط±ط¨ظٹ", visible: true }
        ],
        services: [
            { title: "ط®ط¯ظ…ط© ط¹ط±ط¨ظٹط©", titleEn: "English service", description: "ط´ط±ط­ ط¹ط±ط¨ظٹ", descriptionEn: "Service details", visible: true },
            { title: "ط®ط¯ظ…ط© ط¨ظ„ط§ طھط±ط¬ظ…ط©", titleEn: "ط¹ظ†ظˆط§ظ† ط¹ط±ط¨ظٹ", description: "ط´ط±ط­ ط¹ط±ط¨ظٹ", visible: true }
        ]
    };

    const preview = renderPreview(draft, "en");

    assert.match(preview, /<html lang="en" dir="ltr">/);
    assert.match(preview, /Madar Tech/);
    assert.match(preview, /English description/);
    assert.match(preview, /English service/);
    assert.doesNotMatch(preview, /[\u0600-\u06FF]/);
});

test("Arabic preview continues to use the Arabic CMS content", () => {
    const preview = renderPreview({
        sections: [{ title: "ط¹ظ†ظˆط§ظ† ط¹ط±ط¨ظٹ", titleEn: "English title", visible: true }]
    }, "ar");

    assert.match(preview, /<html lang="ar" dir="rtl">/);
    assert.match(preview, /ط¹ظ†ظˆط§ظ† ط¹ط±ط¨ظٹ/);
});
