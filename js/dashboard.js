import { authenticate, createEmptyDraft, loadDraft, logout, saveDraft } from "./draft-adapter.js";
import { renderPreview } from "./preview-renderer.js";

const translations = {
    ar: {
        brandName: "مدار تك", logoAlt: "شعار مدار تك", mainNav: "القائمة الرئيسية", openMenu: "فتح القائمة",
        brandSubtitle: "إدارة الموقع", navOverview: "نظرة عامة", navContent: "إدارة المحتوى", navSystem: "النظام",
        navHome: "لوحة التحكم", navSections: "أقسام الموقع", navPages: "الصفحات", navServices: "الخدمات", navProjects: "المشاريع",
        navTeam: "فريق العمل", navTestimonials: "آراء العملاء", navFaq: "الأسئلة الشائعة", navMessages: "الرسائل", navSettings: "الإعدادات",
        viewSite: "عرض الموقع", preview: "معاينة", save: "حفظ التغييرات", loading: "جارٍ تحميل المسودة…", saved: "تم الحفظ في هذا المتصفح", saving: "جارٍ الحفظ…",
        unsaved: "تغييرات غير محفوظة", saveError: "تعذّر الحفظ", retry: "إعادة المحاولة", previewEyebrow: "عرض تجريبي", previewTitle: "معاينة الموقع",
        homeTitle: "لوحة التحكم", homeDescription: "نظرة سريعة على محتوى موقع مدار تك.", welcome: "مرحباً بك في إدارة موقع مدار تك",
        welcomeDescription: "أدر صفحات الموقع وأقسامه ومحتواه من مكان واحد.", visitors: "عدد الزوار", pages: "الصفحات", services: "الخدمات",
        projects: "المشاريع", messages: "الرسائل", quickActions: "الوصول السريع", recentMessages: "أحدث الرسائل", noMessages: "لا توجد رسائل بعد.",
        contentSections: "أقسام المحتوى", editSections: "أضف أقسام الموقع ورتّبها وأدر ظهورها.", manage: "إدارة", add: "إضافة عنصر",
        edit: "تعديل", delete: "حذف", hide: "إخفاء", show: "إظهار", visible: "ظاهر", hidden: "مخفي", order: "الترتيب",
        actions: "الإجراءات", title: "العنوان", subtitle: "العنوان الفرعي", description: "الوصف", image: "رابط الصورة",
        name: "الاسم", nameEnglish: "الاسم بالإنجليزية", sectionName: "اسم القسم", sectionKey: "نوع المحتوى المرتبط", slug: "الرابط المختصر (slug)", status: "الحالة",
        notTranslated: "لا تتوفر ترجمة إنجليزية لهذا المحتوى.",
        published: "منشور", draft: "مسودة", shortDescription: "وصف قصير", category: "الفئة", projectUrl: "رابط المشروع",
        titleEnglish: "العنوان بالإنجليزية", subtitleEnglish: "العنوان الفرعي بالإنجليزية", descriptionEnglish: "الوصف بالإنجليزية",
        shortDescriptionEnglish: "الوصف القصير بالإنجليزية", categoryEnglish: "الفئة بالإنجليزية",
        icon: "الأيقونة", role: "المنصب", roleEnglish: "المنصب بالإنجليزية", bio: "نبذة", bioEnglish: "النبذة بالإنجليزية",
        instagram: "رابط إنستغرام", linkedin: "رابط لينكدإن", twitter: "رابط إكس / تويتر",
        testimonialText: "نص الرأي", testimonialTextEnglish: "نص الرأي بالإنجليزية", rating: "التقييم (من 1 إلى 5)",
        question: "السؤال", questionEnglish: "السؤال بالإنجليزية", answer: "الإجابة", answerEnglish: "الإجابة بالإنجليزية", siteName: "اسم الموقع",
        siteNameEnglish: "اسم الموقع بالإنجليزية", siteDescription: "وصف الموقع", siteDescriptionEnglish: "وصف الموقع بالإنجليزية",
        locationEnglish: "العنوان بالإنجليزية", contactEmail: "البريد الإلكتروني للتواصل", contactPhone: "هاتف التواصل", location: "العنوان",
        visitorCount: "عدد الزوار (يدوي)", cancel: "إلغاء", saveItem: "حفظ", newItem: "إضافة عنصر جديد", editItem: "تعديل العنصر",
        sectionKinds: "لا يوجد ربط", about: "من نحن", sectionServices: "الخدمات", sectionProjects: "المشاريع", sectionTeam: "فريق العمل",
        sectionTestimonials: "آراء العملاء", sectionFaq: "الأسئلة الشائعة", sectionContact: "تواصل معنا",
        pagesTitle: "إدارة الصفحات", pagesDescription: "أنشئ صفحات الموقع وعدّل بياناتها ورتّب ظهورها.",
        servicesTitle: "إدارة الخدمات", servicesDescription: "أضف الخدمات المعروضة على الموقع وأدر ترتيبها وظهورها.",
        projectsTitle: "إدارة المشاريع", projectsDescription: "أدر المشاريع وصورها وتصنيفاتها وروابطها.",
        teamTitle: "إدارة فريق العمل", teamDescription: "أدر ملفات أعضاء الفريق وروابط التواصل.",
        testimonialsTitle: "آراء العملاء", testimonialsDescription: "أدر شهادات وآراء العملاء المعروضة على الموقع.",
        faqTitle: "الأسئلة الشائعة", faqDescription: "أضف الأسئلة والإجابات ورتّب ما يظهر منها.",
        messagesTitle: "رسائل التواصل", messagesDescription: "راجع الرسائل الواردة وحدد حالتها أو احذفها.",
        settingsTitle: "إعدادات الموقع", settingsDescription: "عدّل المعلومات الأساسية المستخدمة في الصفحة الرئيسية والمعاينة.",
        search: "ابحث…", allMessages: "كل الرسائل", unread: "غير مقروءة", read: "مقروءة", markRead: "تحديد كمقروءة",
        markUnread: "تحديد كغير مقروءة", date: "التاريخ", email: "البريد", phone: "الهاتف", message: "الرسالة",
        noItems: "لا توجد عناصر هنا بعد.", noItemsHint: "ابدأ بإضافة أول عنصر.", saveSettings: "حفظ الإعدادات",
        confirmDelete: "هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.", confirmReload: "ستؤدي إعادة التحميل إلى استبدال التغييرات غير المحفوظة بالمسودة المحفوظة في هذا المتصفح. هل تريد المتابعة؟",
        created: "تمت الإضافة إلى المسودة.", updated: "تم تحديث العنصر في المسودة.", removed: "تم حذف العنصر من المسودة.",
        moved: "تم تحديث الترتيب.", exported: "تم تنزيل نسخة JSON.", loadFailed: "تعذّر تحميل المسودة من /api/draft. يمكنك المتابعة مؤقتاً، لكن لن تُحفظ التغييرات حتى يتوفر الاتصال بالخادم.",
        saveFailed: "تعذّر حفظ المسودة في مساحة هذا المتصفح. حرّر مساحة ثم أعد المحاولة.", loadSuccess: "تم تحميل المسودة.",
        itemCount: "عنصر", projectPublished: "النشر", readStatus: "مقروءة", unreadStatus: "جديدة",
        noSectionItems: "أقسام الموقع غير مضافة بعد.", contentTypeHint: "اختر مجموعة المحتوى التي سيعرضها هذا القسم في المعاينة.",
        settingsSaved: "تم تحديث الإعدادات في المسودة.", exportJson: "تصدير JSON", close: "إغلاق", unknown: "—",
        logout: "تسجيل الخروج", loginEyebrow: "حماية لوحة التحكم", loginTitle: "تسجيل الدخول",
        loginDescription: "أدخل كلمة المرور التي ظهرت عند إعداد الخادم.", loginPassword: "كلمة مرور الإدارة",
        loginSubmit: "دخول", loginRequired: "يلزم تسجيل الدخول لتحميل المسودة.", loginInvalid: "كلمة المرور غير صحيحة.",
        loginRateLimited: "محاولات كثيرة. انتظر قليلاً ثم حاول مجدداً.", loginUnavailable: "تعذّر الاتصال بالخادم. تحقق من تشغيله ثم أعد المحاولة.",
        confirmLogout: "لديك تغييرات غير محفوظة. هل تريد تسجيل الخروج؟"
    },
    en: {
        brandName: "Madar Tech", logoAlt: "Madar Tech logo", mainNav: "Main navigation", openMenu: "Open menu",
        brandSubtitle: "Website CMS", navOverview: "OVERVIEW", navContent: "CONTENT", navSystem: "SYSTEM",
        navHome: "Dashboard", navSections: "Site sections", navPages: "Pages", navServices: "Services", navProjects: "Projects",
        navTeam: "Team", navTestimonials: "Testimonials", navFaq: "FAQ", navMessages: "Messages", navSettings: "Settings",
        viewSite: "View website", preview: "Preview", save: "Save changes", loading: "Loading draft…", saved: "Saved in this browser", saving: "Saving…",
        unsaved: "Unsaved changes", saveError: "Save failed", retry: "Retry", previewEyebrow: "Preview", previewTitle: "Website preview",
        homeTitle: "Dashboard", homeDescription: "A quick overview of Madar Tech website content.", welcome: "Welcome to Madar Tech CMS",
        welcomeDescription: "Manage website pages, sections, and content in one place.", visitors: "Visitors", pages: "Pages", services: "Services",
        projects: "Projects", messages: "Messages", quickActions: "Quick access", recentMessages: "Recent messages", noMessages: "No messages yet.",
        contentSections: "Content sections", editSections: "Add, reorder, and manage the visibility of website sections.", manage: "Manage", add: "Add item",
        edit: "Edit", delete: "Delete", hide: "Hide", show: "Show", visible: "Visible", hidden: "Hidden", order: "Order",
        actions: "Actions", title: "Title", subtitle: "Subtitle", description: "Description", image: "Image URL",
        name: "Name", nameEnglish: "Name (English)", sectionName: "Section name", sectionKey: "Linked content type", slug: "Slug", status: "Status",
        notTranslated: "Not available in English yet.",
        titleEnglish: "Title (English)", subtitleEnglish: "Subtitle (English)", descriptionEnglish: "Description (English)",
        published: "Published", draft: "Draft", shortDescription: "Short description", shortDescriptionEnglish: "Short description (English)",
        category: "Category", categoryEnglish: "Category (English)", projectUrl: "Project URL",
        icon: "Icon", role: "Role", roleEnglish: "Role (English)", bio: "Bio", bioEnglish: "Bio (English)",
        instagram: "Instagram URL", linkedin: "LinkedIn URL", twitter: "X / Twitter URL",
        testimonialText: "Testimonial", testimonialTextEnglish: "Testimonial (English)", rating: "Rating (1–5)",
        question: "Question", questionEnglish: "Question (English)", answer: "Answer", answerEnglish: "Answer (English)", siteName: "Website name",
        siteNameEnglish: "Website name (English)", siteDescription: "Website description", siteDescriptionEnglish: "Website description (English)",
        contactEmail: "Contact email", contactPhone: "Contact phone", location: "Address", locationEnglish: "Address (English)",
        visitorCount: "Visitor count (manual)", cancel: "Cancel", saveItem: "Save", newItem: "Add item", editItem: "Edit item",
        sectionKinds: "None", about: "About", sectionServices: "Services", sectionProjects: "Projects", sectionTeam: "Team",
        sectionTestimonials: "Testimonials", sectionFaq: "FAQ", sectionContact: "Contact",
        pagesTitle: "Manage pages", pagesDescription: "Create pages, edit their details, and change their order.",
        servicesTitle: "Manage services", servicesDescription: "Manage website services, ordering, and visibility.",
        projectsTitle: "Manage projects", projectsDescription: "Manage projects, images, categories, and links.",
        teamTitle: "Manage team", teamDescription: "Manage team profiles and social links.",
        testimonialsTitle: "Manage testimonials", testimonialsDescription: "Manage customer testimonials shown on the website.",
        faqTitle: "Manage FAQ", faqDescription: "Add questions and answers, and choose which ones to show.",
        messagesTitle: "Contact messages", messagesDescription: "Review incoming messages, update their status, or delete them.",
        settingsTitle: "Website settings", settingsDescription: "Edit basic information used by the homepage and preview.",
        search: "Search…", allMessages: "All messages", unread: "Unread", read: "Read", markRead: "Mark as read",
        markUnread: "Mark as unread", date: "Date", email: "Email", phone: "Phone", message: "Message",
        noItems: "Nothing here yet.", noItemsHint: "Add your first item to get started.", saveSettings: "Save settings",
        confirmDelete: "Are you sure you want to delete this item? This cannot be undone.", confirmReload: "Reloading will replace your unsaved changes with the draft saved in this browser. Continue?",
        created: "Item added to the draft.", updated: "Draft item updated.", removed: "Item removed from the draft.",
        moved: "Order updated.", exported: "JSON file downloaded.", loadFailed: "Could not load the draft from /api/draft. You can continue temporarily, but changes will not persist until the server is available.",
        saveFailed: "Could not save the draft in this browser. Free up storage space and try again.", loadSuccess: "Draft loaded.",
        itemCount: "items", projectPublished: "Publishing", readStatus: "Read", unreadStatus: "New",
        noSectionItems: "No website sections yet.", contentTypeHint: "Choose the content collection this section will display in preview.",
        settingsSaved: "Settings updated in the draft.", exportJson: "Export JSON", close: "Close", unknown: "—",
        logout: "Sign out", loginEyebrow: "Dashboard security", loginTitle: "Sign in",
        loginDescription: "Enter the password shown when the server was set up.", loginPassword: "Administrator password",
        loginSubmit: "Sign in", loginRequired: "Sign in is required to load the draft.", loginInvalid: "The password is incorrect.",
        loginRateLimited: "Too many attempts. Wait a little and try again.", loginUnavailable: "Could not connect to the server. Check that it is running and try again.",
        confirmLogout: "You have unsaved changes. Do you want to sign out?"
    }
};

const viewTitles = {
    home: "navHome", sections: "navSections", pages: "navPages", services: "navServices", projects: "navProjects",
    teamMembers: "navTeam", testimonials: "navTestimonials", faq: "navFaq", messages: "navMessages", settings: "navSettings"
};
const entityConfig = {
    sections: {
        title: "contentSections", description: "editSections", singular: "navSections",
        fields: [
            { key: "name", label: "sectionName" }, { key: "nameEn", label: "nameEnglish" },
            { key: "title", label: "title" }, { key: "titleEn", label: "titleEnglish" },
            { key: "subtitle", label: "subtitle" }, { key: "subtitleEn", label: "subtitleEnglish" },
            { key: "description", label: "description", type: "textarea", full: true },
            { key: "descriptionEn", label: "descriptionEnglish", type: "textarea", full: true },
            { key: "image", label: "image", type: "url" },
            { key: "sectionKey", label: "sectionKey", type: "select", options: ["", "about", "services", "projects", "teamMembers", "testimonials", "faq", "contact"], full: true },
            { key: "visible", label: "visible", type: "checkbox" }
        ]
    },
    pages: {
        title: "pagesTitle", description: "pagesDescription", singular: "navPages",
        fields: [
            { key: "title", label: "title" }, { key: "titleEn", label: "titleEnglish" }, { key: "slug", label: "slug" },
            { key: "description", label: "description", type: "textarea", full: true },
            { key: "descriptionEn", label: "descriptionEnglish", type: "textarea", full: true }, { key: "visible", label: "visible", type: "checkbox" }
        ]
    },
    services: {
        title: "servicesTitle", description: "servicesDescription", singular: "navServices",
        fields: [
            { key: "title", label: "title" }, { key: "titleEn", label: "titleEnglish" }, { key: "icon", label: "icon" },
            { key: "description", label: "description", type: "textarea", full: true },
            { key: "descriptionEn", label: "descriptionEnglish", type: "textarea", full: true },
            { key: "image", label: "image", type: "url" }, { key: "visible", label: "visible", type: "checkbox" }
        ]
    },
    projects: {
        title: "projectsTitle", description: "projectsDescription", singular: "navProjects",
        fields: [
            { key: "title", label: "title" }, { key: "titleEn", label: "titleEnglish" },
            { key: "category", label: "category" }, { key: "categoryEn", label: "categoryEnglish" },
            { key: "image", label: "image", type: "url" }, { key: "url", label: "projectUrl", type: "url" },
            { key: "shortDescription", label: "shortDescription", type: "textarea", full: true },
            { key: "shortDescriptionEn", label: "shortDescriptionEnglish", type: "textarea", full: true },
            { key: "description", label: "description", type: "textarea", full: true },
            { key: "descriptionEn", label: "descriptionEnglish", type: "textarea", full: true },
            { key: "status", label: "projectPublished", type: "select", options: ["published", "draft"] },
            { key: "visible", label: "visible", type: "checkbox" }
        ]
    },
    teamMembers: {
        title: "teamTitle", description: "teamDescription", singular: "navTeam",
        fields: [
            { key: "name", label: "name" }, { key: "nameEn", label: "nameEnglish" },
            { key: "role", label: "role" }, { key: "roleEn", label: "roleEnglish" },
            { key: "image", label: "image", type: "url" }, { key: "bio", label: "bio", type: "textarea", full: true },
            { key: "bioEn", label: "bioEnglish", type: "textarea", full: true },
            { key: "social.instagram", label: "instagram", type: "url" }, { key: "social.linkedin", label: "linkedin", type: "url" },
            { key: "social.twitter", label: "twitter", type: "url" }, { key: "visible", label: "visible", type: "checkbox" }
        ]
    },
    testimonials: {
        title: "testimonialsTitle", description: "testimonialsDescription", singular: "navTestimonials",
        fields: [
            { key: "name", label: "name" }, { key: "nameEn", label: "nameEnglish" }, { key: "image", label: "image", type: "url" },
            { key: "text", label: "testimonialText", type: "textarea", full: true },
            { key: "textEn", label: "testimonialTextEnglish", type: "textarea", full: true },
            { key: "rating", label: "rating", type: "number", min: 1, max: 5 }, { key: "visible", label: "visible", type: "checkbox" }
        ]
    },
    faq: {
        title: "faqTitle", description: "faqDescription", singular: "navFaq",
        fields: [
            { key: "question", label: "question", type: "textarea", full: true },
            { key: "questionEn", label: "questionEnglish", type: "textarea", full: true },
            { key: "answer", label: "answer", type: "textarea", full: true },
            { key: "answerEn", label: "answerEnglish", type: "textarea", full: true }, { key: "visible", label: "visible", type: "checkbox" }
        ]
    }
};

const sectionTypeLabels = {
    "": "sectionKinds", about: "about", services: "sectionServices", projects: "sectionProjects", teamMembers: "sectionTeam",
    testimonials: "sectionTestimonials", faq: "sectionFaq", contact: "sectionContact"
};

const state = {
    draft: createEmptyDraft(), locale: localStorage.getItem("madar-dashboard-locale") === "en" ? "en" : "ar",
    currentView: "home", editingId: null, messageFilter: "all", search: "", ready: false
};
const root = document.getElementById("viewRoot");
const notice = document.getElementById("notice");
const saveState = document.getElementById("saveState");
const saveButton = document.getElementById("saveButton");
const previewDialog = document.getElementById("previewDialog");
const previewFrame = document.getElementById("previewFrame");
const loginDialog = document.getElementById("loginDialog");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const adminPassword = document.getElementById("adminPassword");
const loginSubmit = document.getElementById("loginSubmit");
const logoutButton = document.getElementById("logoutButton");
let revision = 0;
let savedRevision = 0;
let saveTimer = null;
let savePromise = null;
let pendingSaveAfterLogin = false;

function t(key) {
    return translations[state.locale][key] || (state.locale === "ar" ? translations.en[key] : key) || key;
}

function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}

function containsArabic(value) {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(String(value));
}

function text(value) {
    if (value == null || value === "") return escapeHtml(t("unknown"));
    if (state.locale === "en" && containsArabic(value)) {
        return escapeHtml(t("notTranslated"));
    }
    return escapeHtml(value);
}

function editorValue(value) {
    return state.locale === "en" && containsArabic(value) ? "" : value || "";
}

function errorMessage(error) {
    return state.locale === "en" && containsArabic(error && error.message) ? "" : error && error.message || "";
}

function localizedField(item, key) {
    return item[state.locale === "en" ? key + "En" : key];
}

function getFieldValue(item, path) {
    return path.split(".").reduce((value, part) => value && value[part], item);
}

function setFieldValue(item, path, value) {
    const parts = path.split(".");
    let target = item;
    for (const part of parts.slice(0, -1)) {
        if (!target[part] || typeof target[part] !== "object") target[part] = {};
        target = target[part];
    }
    target[parts[parts.length - 1]] = value;
}

function setSaveStatus(status, key) {
    saveState.dataset.state = status;
    saveState.querySelector("span").textContent = t(key);
}

function showNotice(message, type = "info", dismissible = false) {
    notice.className = `notice${type === "error" ? " error" : type === "success" ? " success" : ""}`;
    notice.innerHTML = `${escapeHtml(message)}${dismissible ? ` <button type="button" class="notice-retry" data-action="retry">${escapeHtml(t("retry"))}</button>` : ""}`;
    notice.hidden = false;
}

function clearNotice() {
    notice.hidden = true;
    notice.textContent = "";
}

function updateLocale() {
    document.documentElement.lang = state.locale;
    document.documentElement.dir = state.locale === "ar" ? "rtl" : "ltr";
    document.title = state.locale === "ar" ? "لوحة مدار تك | إدارة الموقع" : "Madar Tech | Website CMS";
    document.querySelectorAll("[data-i18n]").forEach((element) => {
        const key = element.dataset.i18n;
        if (element.dataset.i18nAttr) element.setAttribute(element.dataset.i18nAttr, t(key));
        else element.textContent = t(key);
    });
    document.getElementById("languageToggle").textContent = state.locale === "ar" ? "EN" : "AR";
    document.getElementById("languageToggle").setAttribute("aria-label", state.locale === "ar" ? "Switch to English" : "Switch to Arabic");
    renderView();
}

function changeLocale() {
    state.locale = state.locale === "ar" ? "en" : "ar";
    localStorage.setItem("madar-dashboard-locale", state.locale);
    updateLocale();
}

function collection(view = state.currentView) {
    return Array.isArray(state.draft[view]) ? state.draft[view] : [];
}

function sorted(items) {
    return [...items].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
}

function itemIsVisible(item) {
    return item.visible !== false && item.status !== "hidden";
}

function statusPill(item, isMessage = false) {
    const isVisible = isMessage ? item.status === "read" : itemIsVisible(item);
    const label = isMessage ? (isVisible ? t("readStatus") : t("unreadStatus")) : (isVisible ? t("visible") : t("hidden"));
    return `<span class="status-pill${isMessage && !isVisible ? " unread" : !isVisible ? " off" : ""}">${escapeHtml(label)}</span>`;
}

function icon(view) {
    return ({ sections: "▤", pages: "▧", services: "✳", projects: "◇", teamMembers: "♧", testimonials: "❞", faq: "?", messages: "✉", settings: "⚙" })[view] || "⌂";
}

function pageHeading(titleKey, descriptionKey, actions = "") {
    return `<div class="page-heading"><div><h1>${escapeHtml(t(titleKey))}</h1><p>${escapeHtml(t(descriptionKey))}</p></div>${actions ? `<div class="heading-actions">${actions}</div>` : ""}</div>`;
}

function renderHome() {
    const unreadCount = collection("messages").filter((message) => message.status !== "read").length;
    const stats = [
        ["visitors", state.draft.settings.visitorCount || 0, "↗"], ["pages", collection("pages").length, "▧"],
        ["services", collection("services").length, "✳"], ["projects", collection("projects").length, "◇"],
        ["messages", collection("messages").length, "✉"]
    ];
    const quickViews = ["sections", "pages", "services", "projects", "teamMembers", "testimonials", "faq", "messages", "settings"];
    const recent = [...collection("messages")].sort((a, b) => Date.parse(b.createdAt || "") - Date.parse(a.createdAt || "")).slice(0, 4);
    return `${pageHeading("homeTitle", "homeDescription")}
        <div class="panel home-welcome">
            <h2>${escapeHtml(t("welcome"))}</h2><p>${escapeHtml(t("welcomeDescription"))}</p>
        </div>
        <div class="stat-grid">${stats.map(([label, count, glyph]) => `<article class="stat-card"><div><p>${escapeHtml(t(label))}</p><strong>${escapeHtml(count)}</strong></div><span class="stat-icon">${glyph}</span></article>`).join("")}</div>
        <div class="home-grid">
            <section class="panel"><div class="panel-head"><div><h2>${escapeHtml(t("quickActions"))}</h2></div></div>
                <div class="quick-grid">${quickViews.map((view) => `<button class="quick-link" type="button" data-action="navigate" data-view="${view}"><span class="nav-icon">${icon(view)}</span><strong>${escapeHtml(t(viewTitles[view]))}</strong></button>`).join("")}</div>
            </section>
            <section class="panel"><div class="panel-head"><div><h2>${escapeHtml(t("recentMessages"))}</h2><p>${unreadCount} ${escapeHtml(t("unread"))}</p></div><button class="button button-outline" type="button" data-action="navigate" data-view="messages">${escapeHtml(t("manage"))}</button></div>
                ${recent.length ? `<div class="activity-list">${recent.map((message) => `<div class="activity-item"><span class="activity-mark"></span><div><strong>${text(message.name)}</strong><small>${text(message.message)}</small></div></div>`).join("")}</div>` : `<div class="empty-state">${escapeHtml(t("noMessages"))}</div>`}
            </section>
        </div>`;
}

function editorField(field, item) {
    const value = getFieldValue(item, field.key);
    const controlId = `field-${field.key.replace(/[^a-z0-9_-]/gi, "-")}`;
    if (field.type === "checkbox") {
        return `<div class="form-field${field.full ? " full-width" : ""}"><label class="check-field" for="${controlId}"><input id="${controlId}" name="${escapeHtml(field.key)}" type="checkbox"${value !== false ? " checked" : ""}>${escapeHtml(t(field.label))}</label></div>`;
    }
    if (field.type === "select") {
        return `<div class="form-field${field.full ? " full-width" : ""}"><label for="${controlId}">${escapeHtml(t(field.label))}</label><select class="field-control" id="${controlId}" name="${escapeHtml(field.key)}">${field.options.map((option) => `<option value="${escapeHtml(option)}"${String(value || "") === option ? " selected" : ""}>${escapeHtml(field.key === "sectionKey" ? t(sectionTypeLabels[option] || "sectionKinds") : t(option === "published" ? "published" : "draft"))}</option>`).join("")}</select>${field.key === "sectionKey" ? `<span class="help-text">${escapeHtml(t("contentTypeHint"))}</span>` : ""}</div>`;
    }
    const type = field.type === "textarea" ? "textarea" : "input";
    const control = type === "textarea"
        ? `<textarea class="field-control textarea" id="${controlId}" name="${escapeHtml(field.key)}" rows="4">${escapeHtml(editorValue(value))}</textarea>`
        : `<input class="field-control" id="${controlId}" name="${escapeHtml(field.key)}" type="${field.type === "number" ? "number" : field.type === "url" ? "text" : "text"}"${field.min ? ` min="${field.min}"` : ""}${field.max ? ` max="${field.max}"` : ""} value="${escapeHtml(editorValue(value))}">`;
    return `<div class="form-field${field.full ? " full-width" : ""}"><label for="${controlId}">${escapeHtml(t(field.label))}</label>${control}</div>`;
}

function editorMarkup(view) {
    if (!state.editingId) return "";
    const config = entityConfig[view];
    const item = state.editingId === "__new__" ? { visible: true, order: collection(view).length + 1, rating: 5 } : collection(view).find((entry) => entry.id === state.editingId);
    if (!item) return "";
    const isNew = state.editingId === "__new__";
    const englishFields = new Set(config.fields.filter((field) => field.key.endsWith("En")).map((field) => field.key.slice(0, -2)));
    const fields = config.fields.filter((field) => state.locale === "en"
        ? field.key.endsWith("En") || !englishFields.has(field.key)
        : !field.key.endsWith("En"));
    return `<section class="editor-card" id="editorCard"><div class="editor-header"><div><h2>${escapeHtml(t(isNew ? "newItem" : "editItem"))} · ${escapeHtml(t(config.singular))}</h2><p>${escapeHtml(t(config.description))}</p></div><button class="icon-button" type="button" data-action="cancel-edit" aria-label="${escapeHtml(t("close"))}">×</button></div>
        <form class="editor-form" id="entityForm" data-view="${view}" data-id="${isNew ? "__new__" : escapeHtml(item.id)}">${fields.map((field) => editorField(field, item)).join("")}
            <div class="editor-footer form-field full-width"><button class="button button-outline" type="button" data-action="cancel-edit">${escapeHtml(t("cancel"))}</button><button class="button button-primary" type="submit">${escapeHtml(t("saveItem"))}</button></div>
        </form></section>`;
}

function listColumns(view) {
    if (view === "sections") return [{ label: "title", value: (item) => localizedField(item, "title") || localizedField(item, "name") }, { label: "subtitle", value: (item) => localizedField(item, "subtitle") || localizedField(item, "description") }];
    if (view === "pages") return [{ label: "title", value: (item) => localizedField(item, "title") }, { label: "slug", value: (item) => item.slug }, { label: "description", value: (item) => localizedField(item, "description") }];
    if (view === "services") return [{ label: "title", value: (item) => localizedField(item, "title") }, { label: "description", value: (item) => localizedField(item, "description") }, { label: "icon", value: (item) => item.icon }];
    if (view === "projects") return [{ label: "title", value: (item) => localizedField(item, "title") }, { label: "category", value: (item) => localizedField(item, "category") }, { label: "projectPublished", value: (item) => t(item.status === "published" ? "published" : "draft") }];
    if (view === "teamMembers") return [{ label: "name", value: (item) => localizedField(item, "name") }, { label: "role", value: (item) => localizedField(item, "role") }, { label: "bio", value: (item) => localizedField(item, "bio") }];
    if (view === "testimonials") return [{ label: "name", value: (item) => localizedField(item, "name") }, { label: "testimonialText", value: (item) => localizedField(item, "text") }, { label: "rating", value: (item) => `${item.rating || 5} / 5` }];
    return [{ label: "question", value: (item) => localizedField(item, "question") }, { label: "answer", value: (item) => localizedField(item, "answer") }];
}

function renderEntityList(view) {
    const config = entityConfig[view];
    const items = sorted(collection(view));
    const columns = listColumns(view);
    const actions = `<button class="button button-outline" type="button" data-action="export">${escapeHtml(t("exportJson"))}</button><button class="button button-primary" type="button" data-action="add">${escapeHtml(t("add"))}</button>`;
    const query = state.search.trim().toLocaleLowerCase();
    const filtered = query ? items.filter((item) => JSON.stringify(item).toLocaleLowerCase().includes(query)) : items;
    return `${pageHeading(config.title, config.description, actions)}${editorMarkup(view)}
        <section class="content-card">
            <div class="list-toolbar"><span class="toolbar-count">${filtered.length} ${escapeHtml(t("itemCount"))}</span><input class="filter-control" id="listSearch" type="search" value="${escapeHtml(state.search)}" placeholder="${escapeHtml(t("search"))}" aria-label="${escapeHtml(t("search"))}"></div>
            ${filtered.length ? `<div class="table-wrap"><table><thead><tr>${columns.map((column) => `<th>${escapeHtml(t(column.label))}</th>`).join("")}<th>${escapeHtml(t("status"))}</th><th>${escapeHtml(t("order"))}</th><th>${escapeHtml(t("actions"))}</th></tr></thead><tbody>${filtered.map((item) => {
                const index = items.findIndex((entry) => entry.id === item.id);
                return `<tr><td class="cell-title">${text(columns[0].value(item))}</td>${columns.slice(1).map((column) => `<td class="${column.label === "description" || column.label === "answer" || column.label === "testimonialText" || column.label === "bio" ? "cell-subtitle detail-text" : "cell-subtitle"}">${text(column.value(item))}</td>`).join("")}<td>${statusPill(item)}</td><td>${escapeHtml(item.order || index + 1)}</td><td><div class="row-actions">
                    <button class="row-action" type="button" data-action="move-up" data-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(t("order"))}" title="${escapeHtml(t("order"))}"${index === 0 ? " disabled" : ""}>↑</button>
                    <button class="row-action" type="button" data-action="move-down" data-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(t("order"))}" title="${escapeHtml(t("order"))}"${index === items.length - 1 ? " disabled" : ""}>↓</button>
                    <button class="row-action" type="button" data-action="toggle" data-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(t(itemIsVisible(item) ? "hide" : "show"))}" title="${escapeHtml(t(itemIsVisible(item) ? "hide" : "show"))}">${itemIsVisible(item) ? "◌" : "●"}</button>
                    <button class="row-action" type="button" data-action="edit" data-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(t("edit"))}" title="${escapeHtml(t("edit"))}">✎</button>
                    <button class="row-action danger" type="button" data-action="delete" data-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(t("delete"))}" title="${escapeHtml(t("delete"))}">×</button>
                </div></td></tr>`;
            }).join("")}</tbody></table></div>` : `<div class="empty-state"><strong>${escapeHtml(t("noItems"))}</strong>${escapeHtml(t("noItemsHint"))}</div>`}
        </section>`;
}

function formatDate(value) {
    if (!value) return t("unknown");
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(state.locale === "ar" ? "ar" : "en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function renderMessages() {
    const filterOptions = [
        ["all", "allMessages"], ["unread", "unread"], ["read", "read"]
    ];
    let messages = [...collection("messages")].sort((a, b) => Date.parse(b.createdAt || "") - Date.parse(a.createdAt || ""));
    if (state.messageFilter === "unread") messages = messages.filter((message) => message.status !== "read");
    if (state.messageFilter === "read") messages = messages.filter((message) => message.status === "read");
    const query = state.search.trim().toLocaleLowerCase();
    if (query) messages = messages.filter((message) => `${message.name} ${message.email} ${message.phone} ${message.message}`.toLocaleLowerCase().includes(query));
    return `${pageHeading("messagesTitle", "messagesDescription", `<button class="button button-outline" type="button" data-action="export">${escapeHtml(t("exportJson"))}</button>`)}
        <section class="content-card"><div class="list-toolbar"><div class="message-filter">${filterOptions.map(([value, key]) => `<button type="button" data-action="filter-messages" data-filter="${value}" class="${state.messageFilter === value ? "active" : ""}">${escapeHtml(t(key))}</button>`).join("")}</div><input class="filter-control" id="listSearch" type="search" value="${escapeHtml(state.search)}" placeholder="${escapeHtml(t("search"))}" aria-label="${escapeHtml(t("search"))}"></div>
        ${messages.length ? `<div class="table-wrap"><table><thead><tr><th>${escapeHtml(t("name"))}</th><th>${escapeHtml(t("email"))}</th><th>${escapeHtml(t("phone"))}</th><th>${escapeHtml(t("message"))}</th><th>${escapeHtml(t("date"))}</th><th>${escapeHtml(t("status"))}</th><th>${escapeHtml(t("actions"))}</th></tr></thead><tbody>${messages.map((message) => `<tr><td class="cell-title">${text(message.name)}</td><td dir="ltr">${text(message.email)}</td><td dir="ltr">${text(message.phone)}</td><td><div class="message-card">${text(message.message)}</div></td><td>${escapeHtml(formatDate(message.createdAt))}</td><td>${statusPill(message, true)}</td><td><div class="row-actions"><button class="row-action" type="button" data-action="toggle-message" data-id="${escapeHtml(message.id)}" title="${escapeHtml(t(message.status === "read" ? "markUnread" : "markRead"))}" aria-label="${escapeHtml(t(message.status === "read" ? "markUnread" : "markRead"))}">${message.status === "read" ? "○" : "●"}</button><button class="row-action danger" type="button" data-action="delete" data-id="${escapeHtml(message.id)}" aria-label="${escapeHtml(t("delete"))}" title="${escapeHtml(t("delete"))}">×</button></div></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state"><strong>${escapeHtml(t("noItems"))}</strong>${escapeHtml(t("noMessages"))}</div>`}
        </section>`;
}

function renderSettings() {
    const settings = state.draft.settings;
    const english = state.locale === "en";
    const fields = [
        { key: english ? "siteNameEn" : "siteName", label: english ? "siteNameEnglish" : "siteName", type: "text" },
        { key: english ? "siteDescriptionEn" : "siteDescription", label: english ? "siteDescriptionEnglish" : "siteDescription", type: "textarea", full: true },
        { key: "contactEmail", type: "email" }, { key: "contactPhone", type: "tel" },
        { key: english ? "locationEn" : "location", label: english ? "locationEnglish" : "location", type: "text" }, { key: "visitorCount", type: "number" }
    ];
    return `${pageHeading("settingsTitle", "settingsDescription", `<button class="button button-outline" type="button" data-action="export">${escapeHtml(t("exportJson"))}</button>`)}
        <section class="editor-card"><form id="settingsForm" class="editor-form">${fields.map((field) => {
            const id = `setting-${field.key}`;
            const value = editorValue(settings[field.key]);
            const control = field.type === "textarea"
                ? `<textarea class="field-control textarea" id="${id}" name="${field.key}" rows="4">${escapeHtml(value)}</textarea>`
                : `<input class="field-control" id="${id}" name="${field.key}" type="${field.type}" value="${escapeHtml(value)}"${field.key === "visitorCount" ? ' min="0"' : ""}>`;
            return `<div class="form-field${field.full ? " full-width" : ""}"><label for="${id}">${escapeHtml(t(field.label || field.key))}</label>${control}</div>`;
        }).join("")}<div class="editor-footer form-field full-width"><button class="button button-primary" type="submit">${escapeHtml(t("saveSettings"))}</button></div></form></section>`;
}

function renderView() {
    document.querySelectorAll(".nav-link").forEach((button) => button.classList.toggle("active", button.dataset.view === state.currentView));
    document.getElementById("currentViewTitle").textContent = t(viewTitles[state.currentView] || "navHome");
    if (state.currentView === "home") root.innerHTML = renderHome();
    else if (entityConfig[state.currentView]) root.innerHTML = renderEntityList(state.currentView);
    else if (state.currentView === "messages") root.innerHTML = renderMessages();
    else if (state.currentView === "settings") root.innerHTML = renderSettings();
    if (previewDialog.open) previewFrame.srcdoc = renderPreview(state.draft, state.locale);
    updateUnreadBadge();
}

function updateUnreadBadge() {
    const badge = document.getElementById("unreadBadge");
    const count = collection("messages").filter((message) => message.status !== "read").length;
    badge.textContent = String(count);
    badge.hidden = count === 0;
}

function setView(view) {
    if (!viewTitles[view]) return;
    state.currentView = view;
    state.editingId = null;
    state.search = "";
    document.getElementById("sidebar").classList.remove("is-open");
    document.getElementById("menuToggle").setAttribute("aria-expanded", "false");
    renderView();
}

function newId() {
    return globalThis.crypto && typeof globalThis.crypto.randomUUID === "function"
        ? globalThis.crypto.randomUUID()
        : `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function slugify(value) {
    return String(value || "").trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
}

function markDirty(message) {
    revision += 1;
    saveButton.disabled = false;
    setSaveStatus("dirty", "unsaved");
    if (message) showNotice(message, "success");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { saveDraftNow(); }, 900);
    if (previewDialog.open) previewFrame.srcdoc = renderPreview(state.draft, state.locale);
}

async function saveDraftNow() {
    clearTimeout(saveTimer);
    if (savePromise) {
        try {
            await savePromise;
        } catch (error) {
            return;
        }
        if (savedRevision < revision) return saveDraftNow();
        return;
    }
    if (savedRevision === revision) return;
    const savingRevision = revision;
    const snapshot = JSON.parse(JSON.stringify(state.draft));
    setSaveStatus("saving", "saving");
    savePromise = saveDraft(snapshot);
    try {
        await savePromise;
        savedRevision = savingRevision;
        clearNotice();
        if (savedRevision === revision) {
            setSaveStatus("saved", "saved");
            saveButton.disabled = true;
        } else {
            setSaveStatus("dirty", "unsaved");
            saveTimer = setTimeout(() => { saveDraftNow(); }, 150);
        }
    } catch (error) {
        if (error.status === 401) {
            pendingSaveAfterLogin = true;
            logoutButton.disabled = true;
            setSaveStatus("error", "loginRequired");
            if (!loginDialog.open) loginDialog.showModal();
            return;
        }
        console.error("Draft save failed.", error);
        setSaveStatus("error", "saveError");
        showNotice(`${t("saveFailed")} ${errorMessage(error)}`.trim(), "error", true);
        saveButton.disabled = false;
    } finally {
        savePromise = null;
    }
}

function exportDraft() {
    const blob = new Blob([JSON.stringify(state.draft, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "madar-tech-draft.json";
    link.click();
    URL.revokeObjectURL(url);
    showNotice(t("exported"), "success");
}

function moveItem(view, id, delta) {
    const items = sorted(collection(view));
    const index = items.findIndex((item) => item.id === id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    items.forEach((item, position) => { item.order = position + 1; });
    state.draft[view] = items;
    renderView();
    markDirty(t("moved"));
}

function handleAction(button) {
    const action = button.dataset.action;
    const view = state.currentView;
    const items = collection(view);
    const id = button.dataset.id;
    if (action === "navigate") return setView(button.dataset.view);
    if (action === "retry") {
        if (revision > savedRevision && !window.confirm(t("confirmReload"))) return;
        return initialize();
    }
    if (action === "export") return exportDraft();
    if (action === "add" && entityConfig[view]) {
        state.editingId = "__new__";
        renderView();
        document.getElementById("editorCard").scrollIntoView({ behavior: "smooth", block: "start" });
        return;
    }
    if (action === "cancel-edit") {
        state.editingId = null;
        renderView();
        return;
    }
    if (action === "edit" && entityConfig[view]) {
        state.editingId = id;
        renderView();
        document.getElementById("editorCard").scrollIntoView({ behavior: "smooth", block: "start" });
        return;
    }
    if (action === "toggle" && entityConfig[view]) {
        const item = items.find((entry) => entry.id === id);
        if (!item) return;
        item.visible = !itemIsVisible(item);
        if (view === "sections") item.status = item.visible ? "published" : "hidden";
        renderView();
        markDirty();
        return;
    }
    if ((action === "move-up" || action === "move-down") && entityConfig[view]) return moveItem(view, id, action === "move-up" ? -1 : 1);
    if (action === "delete") {
        if (!window.confirm(t("confirmDelete"))) return;
        const key = view === "messages" ? "messages" : view;
        state.draft[key] = state.draft[key].filter((entry) => entry.id !== id);
        state.editingId = null;
        renderView();
        markDirty(t("removed"));
        return;
    }
    if (action === "filter-messages") {
        state.messageFilter = button.dataset.filter;
        renderView();
        return;
    }
    if (action === "toggle-message") {
        const message = collection("messages").find((entry) => entry.id === id);
        if (!message) return;
        message.status = message.status === "read" ? "unread" : "read";
        renderView();
        markDirty();
    }
}

function saveEntity(form) {
    const view = form.dataset.view;
    const id = form.dataset.id;
    const isNew = id === "__new__";
    const current = isNew ? { id: newId(), order: collection(view).length + 1, visible: true } : collection(view).find((item) => item.id === id);
    if (!current) return;
    for (const field of entityConfig[view].fields) {
        const control = form.elements.namedItem(field.key);
        if (!control) continue;
        let value;
        if (field.type === "checkbox") value = control.checked;
        else if (field.type === "number") value = Number(control.value) || 0;
        else value = control.value.trim();
        setFieldValue(current, field.key, value);
    }
    if (view === "sections") current.status = current.visible ? "published" : "hidden";
    if (view === "projects" && current.status !== "published") current.status = "draft";
    if (view === "pages" && !current.slug) current.slug = slugify(current.title);
    if (isNew) state.draft[view].push(current);
    state.editingId = null;
    renderView();
    markDirty(t(isNew ? "created" : "updated"));
}

function saveSettings(form) {
    for (const control of form.elements) {
        if (!control.name) continue;
        state.draft.settings[control.name] = control.name === "visitorCount" ? Math.max(0, Number(control.value) || 0) : control.value.trim();
    }
    renderView();
    markDirty(t("settingsSaved"));
}

root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (button) handleAction(button);
});
notice.addEventListener("click", (event) => {
    if (!event.target.closest('[data-action="retry"]')) return;
    if (revision > savedRevision && !window.confirm(t("confirmReload"))) return;
    initialize();
});
root.addEventListener("submit", (event) => {
    if (event.target.id === "entityForm") {
        event.preventDefault();
        saveEntity(event.target);
    } else if (event.target.id === "settingsForm") {
        event.preventDefault();
        saveSettings(event.target);
    }
});
root.addEventListener("input", (event) => {
    if (event.target.id === "listSearch") {
        const cursor = event.target.selectionStart;
        state.search = event.target.value;
        renderView();
        const replacement = document.getElementById("listSearch");
        replacement.focus();
        replacement.setSelectionRange(cursor, cursor);
    }
});

document.querySelector(".side-nav").addEventListener("click", (event) => {
    const button = event.target.closest("[data-view]");
    if (button) setView(button.dataset.view);
});
document.getElementById("languageToggle").addEventListener("click", changeLocale);
document.getElementById("exportButton").addEventListener("click", exportDraft);
document.getElementById("saveButton").addEventListener("click", saveDraftNow);
logoutButton.addEventListener("click", async () => {
    if (revision > savedRevision && !window.confirm(t("confirmLogout"))) return;
    logoutButton.disabled = true;
    try {
        await logout();
        state.ready = false;
        await initialize();
    } catch (error) {
        console.error("Dashboard logout failed.", error);
        showNotice(`${t("loginUnavailable")} ${errorMessage(error)}`.trim(), "error", true);
        logoutButton.disabled = false;
    }
});
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginError.hidden = true;
    loginSubmit.disabled = true;
    try {
        await authenticate(adminPassword.value);
        adminPassword.value = "";
        loginDialog.close();
        if (pendingSaveAfterLogin) {
            pendingSaveAfterLogin = false;
            logoutButton.disabled = false;
            setSaveStatus("dirty", "unsaved");
            await saveDraftNow();
        } else {
            await initialize();
        }
    } catch (error) {
        if (error.status !== 401 && error.status !== 429) console.error("Dashboard login failed.", error);
        loginError.textContent = error.status === 401
            ? t("loginInvalid")
            : error.status === 429
                ? t("loginRateLimited")
                : t("loginUnavailable");
        loginError.hidden = false;
        adminPassword.select();
    } finally {
        loginSubmit.disabled = false;
    }
});
loginDialog.addEventListener("cancel", (event) => event.preventDefault());
document.getElementById("previewButton").addEventListener("click", () => {
    previewFrame.srcdoc = renderPreview(state.draft, state.locale);
    previewDialog.showModal();
});
document.getElementById("closePreview").addEventListener("click", () => previewDialog.close());
previewDialog.addEventListener("click", (event) => {
    if (event.target === previewDialog) previewDialog.close();
});
document.getElementById("menuToggle").addEventListener("click", (event) => {
    const sidebar = document.getElementById("sidebar");
    const isOpen = sidebar.classList.toggle("is-open");
    event.currentTarget.setAttribute("aria-expanded", String(isOpen));
});

async function initialize() {
    saveButton.disabled = true;
    setSaveStatus("loading", "loading");
    try {
        state.draft = await loadDraft();
        state.ready = true;
        revision = 0;
        savedRevision = 0;
        logoutButton.disabled = false;
        setSaveStatus("saved", "saved");
        clearNotice();
    } catch (error) {
        if (error.status === 401) {
            state.ready = false;
            logoutButton.disabled = true;
            setSaveStatus("error", "loginRequired");
            if (!loginDialog.open) loginDialog.showModal();
            saveButton.disabled = true;
            return;
        }
        console.error("Draft load failed.", error);
        state.draft = createEmptyDraft();
        state.ready = true;
        revision = 0;
        savedRevision = 0;
        setSaveStatus("error", "saveError");
        showNotice(`${t("loadFailed")} ${errorMessage(error)}`.trim(), "error", true);
    }
    saveButton.disabled = false;
    renderView();
}

updateLocale();
initialize();
