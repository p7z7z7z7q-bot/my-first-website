// دسکتاپ فقط، زیرمنو با hover کار میکنه
const dropdowns = document.querySelectorAll('.dropbtn');

dropdowns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const content = btn.nextElementSibling;
        content.classList.toggle('open');
    });
});
