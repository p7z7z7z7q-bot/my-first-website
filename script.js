// ===== منو همبرگری موبایل =====
const menuBtn = document.querySelector('.menu-btn');
const nav = document.querySelector('nav');

menuBtn.addEventListener('click', () => {
    nav.classList.toggle('active');
});

// ===== زیرمنوهای موبایل (برای هر dropbtn جدا) =====
const dropdownBtns = document.querySelectorAll('.dropbtn');

dropdownBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault(); // جلوگیری از رفتن به لینک
        const dropdownContent = btn.nextElementSibling; // فقط زیرمنوی مربوط به این دکمه
        dropdownContent.classList.toggle('open');
    });
});
