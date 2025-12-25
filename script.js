// منو همبرگری موبایل
const menuBtn = document.querySelector('.menu-btn');
const nav = document.querySelector('nav');

menuBtn.addEventListener('click', () => {
    nav.classList.toggle('active');
});

// زیرمنوی موبایل برای "بازی‌ها ▾"
const dropdownBtn = document.querySelector('.dropbtn');
const dropdownContent = document.querySelector('.dropdown-content');

dropdownBtn.addEventListener('click', (e) => {
    e.preventDefault(); // جلوگیری از رفتن به لینک
    dropdownContent.classList.toggle('open');
});
