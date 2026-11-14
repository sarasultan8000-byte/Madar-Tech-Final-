// فتح وإغلاق قائمة الموبايل
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

menuBtn.addEventListener("click", function () {
    navLinks.classList.toggle("show");
});

// إغلاق القائمة بعد اختيار رابط
const links = document.querySelectorAll(".nav-links a");

links.forEach(function (link) {
    link.addEventListener("click", function () {
        navLinks.classList.remove("show");
    });
});

// إرسال نموذج التواصل إلى واتساب
const contactForm = document.getElementById("contactForm");

contactForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.querySelector('[name="name"]').value;
    const email = document.querySelector('[name="email"]').value;
    const phone = document.querySelector('[name="phone"]').value;
    const message = document.querySelector('[name="message"]').value;

    const whatsappNumber = "972598202765";

    const text =
        "مرحباً مدار تك، لدي استفسار من الموقع:\n" +
        "الاسم: " + name + "\n" +
        "البريد الإلكتروني: " + email + "\n" +
        "رقم الهاتف: " + phone + "\n" +
        "الرسالة: " + message;

    const whatsappLink =
        "https://wa.me/" + whatsappNumber +
        "?text=" + encodeURIComponent(text);

    window.open(whatsappLink, "_blank");
});
