const fs = require("fs");
const p = "dashboard/dashboard.html";
let s = fs.readFileSync(p, "utf8");

s = s.replace(
  /(<button\b(?=[^>]*id="menuToggle")[^>]*>)[\s\S]*?(<\/button>)/,
  "$1\u2630$2"
);
s = s.replace(
  /(<button\b(?=[^>]*id="previewButton")[^>]*>\s*<span>)[\s\S]*?(<\/span>)/,
  "$1\u25c9$2"
);
s = s.replace(
  /(<button\b(?=[^>]*id="saveButton")[^>]*>\s*<span>)[\s\S]*?(<\/span>)/,
  "$1\u2713$2"
);

fs.writeFileSync(p, s, "utf8");
console.log("Top icons fixed");
