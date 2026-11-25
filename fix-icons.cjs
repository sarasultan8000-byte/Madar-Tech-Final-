const fs = require("fs");
const p = "dashboard/dashboard.html";
let s = fs.readFileSync(p, "utf8");
const icons = ["⌂", "▤", "▧", "✳", "◇", "♧", "❞", "?", "✉", "⚙"];
const views = ["home", "sections", "pages", "services", "projects", "teamMembers", "testimonials", "faq", "messages", "settings"];
views.forEach((view, i) => {
  const re = new RegExp('(data-view="' + view + '"><span class="nav-icon">)[\\s\\S]*?(</span>)');
  s = s.replace(re, "$1" + icons[i] + "$2");
});
s = s.replace(/(<a class="site-link"[^>]*><span>)[\s\S]*?(<\/span>)/, "$1↗$2");
fs.writeFileSync(p, s, "utf8");
console.log("Icons fixed");
