import assert from "node:assert/strict";
import test from "node:test";
import { createEmptyDraft } from "../js/draft-adapter.js";
import { renderPreview } from "../js/preview-renderer.js";

test("the starter draft includes English content for its preview", () => {
    const preview = renderPreview(createEmptyDraft(), "en");

    assert.match(preview, /Training and development/);
    assert.match(preview, /What is Madar Tech\?/);
    assert.doesNotMatch(preview, /[\u0600-\u06FF]/);
});

test("English preview uses English CMS content and never falls back to Arabic", () => {
    const draft = {
        settings: { siteName: "اسم الموقع" },
        sections: [
            {
                id: "services", title: "الخدمات", titleEn: "Services",
                description: "وصف عربي", descriptionEn: "English description",
                sectionKey: "services", visible: true
            },
            { id: "untranslated", title: "عنوان عربي", description: "وصف عربي", visible: true }
        ],
        services: [
            { title: "خدمة عربية", titleEn: "English service", description: "شرح عربي", descriptionEn: "Service details", visible: true },
            { title: "خدمة بلا ترجمة", titleEn: "عنوان عربي", description: "شرح عربي", visible: true }
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
        sections: [{ title: "عنوان عربي", titleEn: "English title", visible: true }]
    }, "ar");

    assert.match(preview, /<html lang="ar" dir="rtl">/);
    assert.match(preview, /عنوان عربي/);
});
