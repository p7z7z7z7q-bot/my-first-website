<script>
  // وقتی صفحه لود شد
  window.addEventListener("load", () => {
    document.body.classList.add("loaded");
  });

  // انیمیشن خروج قبل از رفتن به لینک
  document.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", function (e) {
      const href = this.getAttribute("href");

      if (!href || href.startsWith("#")) return;

      e.preventDefault();
      document.body.classList.remove("loaded");

      setTimeout(() => {
        window.location.href = href;
      }, 300);
    });
  });
</script>


