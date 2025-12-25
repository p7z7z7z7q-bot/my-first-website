// منو همبرگری موبایل
const menuBtn = document.querySelector('.menu-btn');
const nav = document.querySelector('nav');

menuBtn.addEventListener('click', () => {
    nav.classList.toggle('active');
});

// زیرمنوهای موبایل
const dropdownBtns = document.querySelectorAll('.dropbtn');

dropdownBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const dropdownContent = btn.nextElementSibling;
        dropdownContent.classList.toggle('open');
    });
});
