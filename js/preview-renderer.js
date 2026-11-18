function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}

function safeUrl(value) {
    const url = String(value || "").trim();
    if (!url || /^(javascript|vbscript|data):/i.test(url) || url.startsWith("//")) return "";
    if (/^(https?:|mailto:|tel:)/i.test(url) || /^(\/|\.\/|\.\.\/|[^:]+$)/.test(url)) return url;
    return "";
}

function visibleItems(items) {
    return (Array.isArray(items) ? items : [])
        .filter((item) => item && item.visible !== false && item.status !== "hidden")
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
}

function localizedValue(item, key, locale) {
    if (!item || typeof item !== "object") return undefined;
    if (locale === "en") {
        const englishValue = item[key + "En"];
        return typeof englishValue === "string"
            && englishValue.trim()
            && !/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(englishValue)
            ? englishValue
            : undefined;
    }
    return typeof item[key] === "string" ? item[key] : undefined;
}

function imageMarkup(value, alt, className = "preview-image") {
    const src = safeUrl(value);
    return src ? `<img class="${className}" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy">` : "";
}

function cardMarkup(item, type, locale) {
    const title = localizedValue(item, "title", locale) || localizedValue(item, "name", locale) || "";
    const description = type === "projects"
        ? localizedValue(item, "shortDescription", locale) || localizedValue(item, "description", locale)
        : type === "teamMembers"
            ? localizedValue(item, "bio", locale)
            : type === "testimonials"
                ? localizedValue(item, "text", locale)
                : localizedValue(item, "description", locale);
    const category = localizedValue(item, "category", locale);
    const role = localizedValue(item, "role", locale);
    const name = localizedValue(item, "name", locale) || "";
    const question = localizedValue(item, "question", locale);
    const answer = localizedValue(item, "answer", locale);
    const image = imageMarkup(item.image || item.imageUrl, title || name);
    if (locale === "en" && !title && !description && !category && !role && !question && !answer) return "";

    if (type === "services") {
        return `<article class="preview-card">${image}<span class="preview-symbol">${escapeHtml(item.icon || "✳")}</span>${title ? `<h3>${escapeHtml(title)}</h3>` : ""}${description ? `<p>${escapeHtml(description)}</p>` : ""}</article>`;
    }
    if (type === "projects") {
        const href = safeUrl(item.url);
        return `<article class="preview-card">${image}${category ? `<span class="preview-tag">${escapeHtml(category)}</span>` : ""}${title ? `<h3>${escapeHtml(title)}</h3>` : ""}${description ? `<p>${escapeHtml(description)}</p>` : ""}${href ? `<a href="${escapeHtml(href)}" rel="noopener noreferrer">${locale === "en" ? "View project" : "عرض المشروع"} ↗</a>` : ""}</article>`;
    }
    if (type === "teamMembers") return `<article class="preview-card">${image}${name ? `<h3>${escapeHtml(name)}</h3>` : ""}${role ? `<span class="preview-role">${escapeHtml(role)}</span>` : ""}${description ? `<p>${escapeHtml(description)}</p>` : ""}</article>`;
    if (type === "testimonials") return `<article class="preview-card"><div class="preview-stars" aria-label="${locale === "en" ? "Rating" : "التقييم"} ${escapeHtml(item.rating || 5)} ${locale === "en" ? "out of" : "من"} 5">${"★".repeat(Math.max(1, Math.min(5, Number(item.rating) || 5)))}</div>${description ? `<p>“${escapeHtml(description)}”</p>` : ""}<strong>${image}${escapeHtml(name)}</strong></article>`;
    if (type === "faq") {
        return `<details class="preview-faq"><summary>${escapeHtml(question || "")}</summary><p>${escapeHtml(answer || "")}</p></details>`;
    }
    return "";
}

function sectionBody(section, draft, locale) {
    const collection = section.sectionKey;
    if (["services", "projects", "teamMembers", "testimonials", "faq"].includes(collection)) {
        const items = visibleItems(draft[collection]).map((item) => cardMarkup(item, collection, locale)).join("");
        return items ? `<div class="preview-grid ${collection === "faq" ? "faq-grid" : ""}">${items}</div>` : "";
    }
    return "";
}

export function renderPreview(draft, locale = "ar") {
    const isEnglish = locale === "en";
    const sections = (Array.isArray(draft.sections) ? draft.sections : [])
        .filter((section) => section && section.visible !== false && section.status !== "hidden")
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    const content = sections.map((section) => {
        const title = localizedValue(section, "title", locale) || localizedValue(section, "name", locale) || "";
        const subtitle = localizedValue(section, "subtitle", locale);
        const description = localizedValue(section, "description", locale);
        const id = String(section.id || section.name || "section").replace(/[^a-zA-Z0-9_-]/g, "-");
        const image = imageMarkup(section.image, title, "section-image");
        const body = sectionBody(section, draft, locale);
        if (locale === "en" && !title && !subtitle && !description && !image && !body) return "";
        return `<section class="site-section" id="${escapeHtml(id)}"><div class="section-inner"><div class="section-copy">${subtitle ? `<span class="eyebrow">${escapeHtml(subtitle)}</span>` : ""}${title ? `<h2>${escapeHtml(title)}</h2>` : ""}${description ? `<p>${escapeHtml(description)}</p>` : ""}</div>${image}${body}</div></section>`;
    }).join("");
    const siteName = localizedValue(draft.settings, "siteName", locale) || (locale === "en"
        ? "Madar Tech"
        : draft.settings && draft.settings.siteName || "مدار تك | Madar Tech");
    const name = escapeHtml(siteName);
    const emptyMessage = isEnglish ? "Add and show a section to see it in this preview." : "أضف قسماً وأظهره لتراه في هذه المعاينة.";
    return `<!doctype html><html lang="${isEnglish ? "en" : "ar"}" dir="${isEnglish ? "ltr" : "rtl"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name}</title><style>
*{box-sizing:border-box}body{margin:0;background:#f6f8f9;color:#182b3c;font-family:Tahoma,Arial,sans-serif;line-height:1.8}.site-header{padding:18px max(5vw,24px);background:#0b2540;color:white;display:flex;align-items:center;justify-content:space-between}.site-header strong{font-size:18px}.site-header span{color:#d7e64b;font-size:12px}.site-section{padding:clamp(38px,7vw,86px) max(5vw,24px);background:#fff;border-bottom:1px solid #e8edf0}.site-section:nth-child(even){background:#f5f7f8}.section-inner{max-width:1100px;margin:auto}.section-copy{max-width:740px;margin:0 auto 30px;text-align:center}.eyebrow{color:#79892b;font-size:13px;font-weight:bold}.section-copy h2{margin:4px 0 8px;color:#0b2540;font-size:clamp(25px,4vw,36px)}.section-copy p{margin:0;color:#607381}.section-image{display:block;width:min(100%,720px);max-height:380px;object-fit:cover;margin:24px auto 0;border-radius:18px}.preview-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:16px;margin-top:28px}.preview-card{padding:20px;border:1px solid #e4eaed;border-radius:14px;background:white;box-shadow:0 10px 24px #0b25400d}.preview-card h3{margin:10px 0 3px;color:#0b2540;font-size:17px}.preview-card p{margin:8px 0 0;color:#627480}.preview-card .preview-image{width:100%;height:160px;object-fit:cover;border-radius:9px}.preview-symbol{display:inline-grid;width:34px;height:34px;place-items:center;border-radius:10px;background:#f4f7d8;color:#0b2540}.preview-tag,.preview-role{color:#71812a;font-size:12px}.preview-card a{display:inline-block;margin-top:10px;color:#0b2540;font-weight:bold}.preview-stars{color:#b49a2e;letter-spacing:2px}.preview-faq{padding:15px 18px;border:1px solid #e4eaed;border-radius:11px;background:white}.preview-faq summary{color:#0b2540;font-weight:bold;cursor:pointer}.preview-faq p{color:#607381}.empty{max-width:620px;margin:70px auto;padding:30px;text-align:center;color:#607381}.site-footer{padding:25px;text-align:center;background:#071a31;color:#fff;font-size:13px}@media(max-width:600px){.site-section{padding-inline:18px}.preview-grid{grid-template-columns:1fr}}
</style></head><body><header class="site-header"><strong>${name}</strong><span>${isEnglish ? "Website preview" : "معاينة الموقع"}</span></header><main>${content || `<div class="empty">${escapeHtml(emptyMessage)}</div>`}</main><footer class="site-footer">${name}</footer></body></html>`;
}
