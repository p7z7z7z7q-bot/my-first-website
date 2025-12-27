// شروع: fade-in امن
document.body.classList.add("is-loading");

window.addEventListener("load", () => {
  document.body.classList.remove("is-loading");
  document.body.classList.add("loaded");
});

// ------------------------------
// Dropdown: کلیک روی "بازی‌ها" فقط منو را باز/بسته کند
// ------------------------------
document.querySelectorAll(".dropbtn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const dropdown = btn.closest(".dropdown");
    if (!dropdown) return;

    dropdown.classList.toggle("open");
  });
});

// کلیک بیرون => بستن dropdown
document.addEventListener("click", (e) => {
  document.querySelectorAll(".dropdown.open").forEach((dd) => {
    if (!dd.contains(e.target)) dd.classList.remove("open");
  });
});

// ------------------------------
// Page Transition: خروج نرم برای لینک‌های داخلی واقعی
// ------------------------------
const isRealInternalLink = (a) => {
  const hrefAttr = a.getAttribute("href");
  if (!hrefAttr) return false;
  if (hrefAttr === "#" || hrefAttr.startsWith("#")) return false;
  if (hrefAttr.startsWith("mailto:") || hrefAttr.startsWith("tel:")) return false;
  if (a.target === "_blank") return false;

  try {
    const url = new URL(a.href);
    if (url.origin !== window.location.origin) return false;
  } catch {
    return false;
  }

  if (a.classList.contains("dropbtn")) return false;
  return true;
};

document.querySelectorAll("a").forEach((link) => {
  if (!isRealInternalLink(link)) return;

  link.addEventListener("click", (e) => {
    e.preventDefault();
    const target = link.href;

    document.body.classList.remove("loaded");
    document.body.classList.add("is-loading");

    setTimeout(() => {
      window.location.href = target;
    }, 400);
  });
});

// ------------------------------
// Search Open/Close (Click + Focus)
// ------------------------------
const searchWrap = document.querySelector(".search-wrapper");
const searchInput = document.querySelector(".search-input");
const searchBtn = document.querySelector(".search-btn");

if (searchWrap && searchInput && searchBtn) {
  searchBtn.addEventListener("click", () => {
    searchWrap.classList.add("open");
    searchInput.focus();
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchWrap.classList.remove("open");
      searchInput.blur();
      searchInput.value = "";
    }
  });

  document.addEventListener("click", (e) => {
    if (!searchWrap.contains(e.target)) {
      searchWrap.classList.remove("open");
    }
  });
}

// ==============================
// Search Filter (Real)
// ==============================
const gamesContainer = document.querySelector(".games");
const gameCards = Array.from(document.querySelectorAll(".game-card"));
const noResultsEl = document.querySelector(".no-results");

const normalize = (s) =>
  (s || "")
    .toString()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const filterCards = (query) => {
  const q = normalize(query);
  let visibleCount = 0;

  gameCards.forEach((card) => {
    const title = card.getAttribute("data-title") || card.querySelector("h2")?.innerText || "";
    const desc  = card.getAttribute("data-desc")  || card.querySelector("p")?.innerText || "";

    const haystack = normalize(title + " " + desc);

    const match = q === "" ? true : haystack.includes(q);
    card.style.display = match ? "" : "none";
    if (match) visibleCount++;
  });

  if (noResultsEl) {
    noResultsEl.hidden = !(q !== "" && visibleCount === 0);
  }
};

// تایپ کردن داخل input => فیلتر لحظه‌ای
if (searchInput && gameCards.length) {
  searchInput.addEventListener("input", (e) => {
    filterCards(e.target.value);
  });

  // Enter هم کار کند
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      filterCards(searchInput.value);
    }

    // Esc => پاک کردن + نمایش همه
    if (e.key === "Escape") {
      searchInput.value = "";
      filterCards("");
    }
  });
}

// کلیک روی دکمه سرچ => اگر بسته بود باز کن، اگر باز بود فیلتر کن
if (searchBtn) {
  searchBtn.addEventListener("click", () => {
    // اگر هنوز باز نشده، باز کن
    if (!searchWrap.classList.contains("open")) {
      searchWrap.classList.add("open");
      searchInput.focus();
      return;
    }
    // اگر بازه، سرچ کن
    filterCards(searchInput.value);
  });
}

