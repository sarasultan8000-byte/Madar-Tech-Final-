const DRAFT_ENDPOINT = "/api/draft";
const LOGIN_ENDPOINT = "/api/auth/login";
const LOGOUT_ENDPOINT = "/api/auth/logout";
const LOCAL_DRAFT_KEY = "madar-tech-dashboard-draft";

const starterSections = [
    { id: "about", name: "من نحن", sectionKey: "about", title: "من نحن", subtitle: "نتعلم اليوم لنصنع فرص الغد.", description: "مدار تك مساحة للتعلم والتدريب وتطوير المهارات وصناعة الفرص.", image: "images/imag4.jpeg", visible: true, order: 1 },
    { id: "services", name: "خدماتنا", sectionKey: "services", title: "خدماتنا", subtitle: "ماذا نقدم؟", description: "خدمات متنوعة للتعلم والعمل وتطوير المهارات.", image: "", visible: true, order: 2 },
    { id: "projects", name: "مشاريعنا", sectionKey: "projects", title: "مشاريعنا", subtitle: "", description: "أبرز المشاريع والمبادرات.", image: "", visible: true, order: 3 },
    { id: "team", name: "فريق العمل", sectionKey: "teamMembers", title: "فريق العمل", subtitle: "", description: "فريق مدار تك.", image: "", visible: true, order: 4 },
    { id: "testimonials", name: "آراء العملاء", sectionKey: "testimonials", title: "آراء العملاء", subtitle: "", description: "", image: "", visible: true, order: 5 },
    { id: "faq", name: "الأسئلة الشائعة", sectionKey: "faq", title: "الأسئلة الشائعة", subtitle: "", description: "", image: "", visible: true, order: 6 },
    { id: "contact", name: "تواصل معنا", sectionKey: "contact", title: "تواصل معنا", subtitle: "نحن هنا لمساعدتك", description: "تواصل معنا، وفريق مدار تك جاهز لمساعدتك.", image: "", visible: true, order: 7 }
];
const starterPages = [
    { id: "home", slug: "/", title: "الرئيسية", description: "موقع مدار تك للتعلم والتدريب وتطوير المهارات.", visible: true, order: 1 }
];
const starterServices = [
    { id: "training-development", title: "التدريب والتطوير", description: "برامج تدريبية متخصصة تهدف إلى تطوير المهارات التقنية والمهنية من خلال التعلم والتطبيق.", icon: "✦", visible: true, order: 1 },
    { id: "coworking", title: "مساحات العمل المشتركة", description: "بيئة مناسبة للطلاب والمستقلين وأصحاب المشاريع لإنجاز أعمالهم وتبادل الأفكار.", icon: "⌂", visible: true, order: 2 },
    { id: "training-rooms", title: "القاعات التدريبية", description: "قاعات مجهزة لاستضافة الدورات التدريبية والاجتماعات والفعاليات والأنشطة.", icon: "▤", visible: true, order: 3 },
    { id: "educational-activities", title: "الأنشطة التعليمية", description: "لقاءات ومبادرات تعليمية تساهم في نشر المعرفة وتبادل الخبرات.", icon: "✳", visible: true, order: 4 }
];
const starterFaq = [
    { id: "about-madar-tech", question: "ما هي مدار تك؟", answer: "مدار تك مؤسسة تعليمية وتدريبية في خانيونس، تربط المعرفة الأكاديمية بالتطبيق العملي وتساعد الشباب على تطوير مهاراتهم.", visible: true, order: 1 },
    { id: "madar-services", question: "ما الخدمات التي تقدمها مدار تك؟", answer: "تشمل خدماتنا التدريب والتطوير، ومساحات العمل المشتركة، والقاعات التدريبية، والأنشطة التعليمية.", visible: true, order: 2 },
    { id: "ask-about-programs", question: "كيف أستفسر عن البرامج التدريبية؟", answer: "أرسل استفسارك عبر نموذج التواصل، وسيفتح واتساب مع تفاصيل رسالتك لإرسالها إلى فريق مدار تك.", visible: true, order: 3 }
];

function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function toText(value, fallback = "") {
    return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}

function getVisible(item, fallback = true) {
    if (typeof item.visible === "boolean") return item.visible;
    if (typeof item.status === "string") return !["hidden", "draft", "inactive", "unpublished"].includes(item.status.toLowerCase());
    return fallback;
}

function normalizeItems(value, type) {
    if (!Array.isArray(value)) return [];
    return value.filter(isRecord).map((item, index) => {
        const visible = type === "projects"
            ? (typeof item.visible === "boolean" ? item.visible : item.status !== "hidden")
            : getVisible(item);
        const base = {
            ...item,
            id: toText(item.id, `${type}-${index + 1}`),
            visible,
            order: Number.isFinite(Number(item.order)) ? Number(item.order) : index + 1
        };
        if (type === "sections") {
            return {
                ...base,
                name: toText(item.name, toText(item.title, `قسم ${index + 1}`)),
                sectionKey: toText(item.sectionKey, ""),
                title: toText(item.title, toText(item.name)),
                subtitle: toText(item.subtitle),
                description: toText(item.description, toText(item.body)),
                image: toText(item.image, toText(item.imageUrl)),
                status: visible ? "published" : "hidden"
            };
        }
        if (type === "pages") return {
            ...base, slug: toText(item.slug), title: toText(item.title, toText(item.name)),
            description: toText(item.description, toText(item.body))
        };
        if (type === "services") return {
            ...base, title: toText(item.title, toText(item.name)),
            description: toText(item.description, toText(item.body)),
            icon: toText(item.icon), image: toText(item.image, toText(item.imageUrl))
        };
        if (type === "projects") return {
            ...base, title: toText(item.title, toText(item.name)),
            shortDescription: toText(item.shortDescription, toText(item.summary)),
            description: toText(item.description, toText(item.body)),
            category: toText(item.category), image: toText(item.image, toText(item.imageUrl)),
            url: toText(item.url), status: toText(item.status, visible ? "published" : "draft")
        };
        if (type === "teamMembers") return {
            ...base, name: toText(item.name, toText(item.title)), role: toText(item.role, toText(item.position)),
            bio: toText(item.bio, toText(item.description)), image: toText(item.image, toText(item.imageUrl)),
            social: isRecord(item.social) ? item.social : {}
        };
        if (type === "testimonials") return {
            ...base, name: toText(item.name), image: toText(item.image, toText(item.imageUrl)),
            text: toText(item.text, toText(item.quote)), rating: Math.min(5, Math.max(1, Number(item.rating) || 5))
        };
        if (type === "faq") return { ...base, question: toText(item.question, toText(item.title)), answer: toText(item.answer, toText(item.description)) };
        return base;
    });
}

function firstLegacySection(source, aliases, fallback) {
    for (const key of aliases) {
        const value = source[key];
        if (isRecord(value)) return value;
    }
    return fallback;
}

function migrateDraft(input) {
    const source = isRecord(input) ? input : {};
    const oldContent = isRecord(source.content) ? source.content : source;
    let sections = source.sections || source.siteSections;

    if (!Array.isArray(sections)) {
        sections = starterSections.map((starter) => {
            const legacy = firstLegacySection(oldContent, [starter.sectionKey, starter.id], {});
            return {
                ...starter,
                title: toText(legacy.title, starter.title),
                subtitle: toText(legacy.subtitle, starter.subtitle),
                description: toText(legacy.description, toText(legacy.body, starter.description)),
                image: toText(legacy.image, starter.image),
                visible: typeof legacy.visible === "boolean" ? legacy.visible : starter.visible
            };
        });
    } else {
        sections = sections.map((section) => {
            if (!isRecord(section)) return section;
            const legacy = firstLegacySection(oldContent, [section.sectionKey, section.id, section.name], {});
            return {
                ...section,
                title: toText(section.title, toText(legacy.title)),
                subtitle: toText(section.subtitle, toText(legacy.subtitle)),
                description: toText(section.description, toText(legacy.description, toText(legacy.body))),
                image: toText(section.image, toText(legacy.image, toText(legacy.imageUrl)))
            };
        });
    }

    const settings = isRecord(source.settings) ? source.settings : {};
    const normalized = {
        version: 2,
        sections: normalizeItems(sections, "sections"),
        pages: normalizeItems(Array.isArray(source.pages) ? source.pages : starterPages, "pages"),
        services: normalizeItems(Array.isArray(source.services) ? source.services : starterServices, "services"),
        projects: normalizeItems(source.projects, "projects"),
        teamMembers: normalizeItems(source.teamMembers || source.team, "teamMembers"),
        testimonials: normalizeItems(source.testimonials, "testimonials"),
        faq: normalizeItems(Array.isArray(source.faq) ? source.faq : Array.isArray(source.faqs) ? source.faqs : starterFaq, "faq"),
        messages: Array.isArray(source.messages) ? source.messages.filter(isRecord).map((message, index) => ({
            ...message,
            id: toText(message.id, `message-${index + 1}`),
            name: toText(message.name),
            email: toText(message.email),
            phone: toText(message.phone),
            message: toText(message.message, toText(message.text)),
            createdAt: toText(message.createdAt, toText(message.date)),
            status: toText(message.status, message.read ? "read" : "unread")
        })) : [],
        settings: {
            siteName: toText(settings.siteName, "مدار تك | Madar Tech"),
            siteDescription: toText(settings.siteDescription, "مساحة للتعلم والتدريب وتطوير المهارات وصناعة الفرص."),
            contactEmail: toText(settings.contactEmail),
            contactPhone: toText(settings.contactPhone),
            location: toText(settings.location),
            visitorCount: Math.max(0, Number(settings.visitorCount) || 0),
            ...settings
        }
    };
    return normalized;
}

async function readResponse(response, endpoint) {
    if (response.status === 204) return null;
    const responseText = await response.text();
    if (!responseText) return null;
    try {
        return JSON.parse(responseText);
    } catch {
        throw new Error(`استجابة ${endpoint} ليست JSON صالحاً.`);
    }
}

async function requestJson(endpoint, method, body) {
    const response = await fetch(endpoint, {
        method,
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    const result = await readResponse(response, endpoint);
    if (!response.ok) {
        const error = new Error(result && result.error
            ? result.error
            : `تعذّر تنفيذ الطلب (HTTP ${response.status}).`);
        error.status = response.status;
        throw error;
    }
    return result;
}

export async function authenticate(password) {
    return requestJson(LOGIN_ENDPOINT, "POST", { password });
}

export async function logout() {
    return requestJson(LOGOUT_ENDPOINT, "POST");
}

async function requestDraft(method, body) {
    return requestJson(DRAFT_ENDPOINT, method, body);
}

function readLocalDraft() {
    let serialized;
    try {
        serialized = localStorage.getItem(LOCAL_DRAFT_KEY);
    } catch (error) {
        throw new Error(`تعذّر قراءة المسودة المحلية: ${error.message}`);
    }
    if (serialized === null) return null;
    try {
        const draft = JSON.parse(serialized);
        if (!isRecord(draft)) throw new Error("invalid shape");
        return draft;
    } catch {
        throw new Error("بيانات المسودة المحلية ليست كائن JSON صالحاً. استعد نسخة صحيحة قبل المتابعة.");
    }
}

function writeLocalDraft(draft) {
    try {
        localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(draft));
    } catch (error) {
        throw new Error(`تعذّر حفظ المسودة في هذا المتصفح: ${error.message}`);
    }
}

export async function loadDraft() {
    const localDraft = readLocalDraft();
    if (localDraft !== null) return migrateDraft(localDraft);

    const result = await requestDraft("GET");
    const draft = isRecord(result) && isRecord(result.draft) ? result.draft : result;
    const normalized = migrateDraft(draft);
    writeLocalDraft(normalized);
    return normalized;
}

export async function saveDraft(draft) {
    const normalized = migrateDraft(draft);
    writeLocalDraft(normalized);
    return normalized;
}

export function createEmptyDraft() {
    return migrateDraft({});
}
