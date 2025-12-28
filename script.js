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
// Site-wide Search (games.json)
// ==============================
const resultsBox = document.querySelector(".search-results");

// تشخیص base برای GitHub Pages project site
const getBasePath = () => {
  const parts = window.location.pathname.split("/").filter(Boolean);
  // اگر روی github.io و پروژه‌ای هستی: /repo-name/...
  if (window.location.hostname.endsWith("github.io") && parts.length > 0) {
    return "/" + parts[0] + "/";
  }
  return "/";
};

const BASE = getBasePath();
const GAMES_JSON_URL = BASE + "data/games.json";

let ALL_GAMES = [];

const normalize = (s) =>
  (s || "")
    .toString()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const renderResults = (items, query) => {
  if (!resultsBox) return;

  const q = normalize(query);

  if (!q) {
    resultsBox.hidden = true;
    resultsBox.innerHTML = "";
    return;
  }

  if (!items.length) {
    resultsBox.hidden = false;
    resultsBox.innerHTML = `<div class="hint">هیچ بازی‌ای پیدا نشد 😅</div>`;
    return;
  }

  resultsBox.hidden = false;
  resultsBox.innerHTML = items
    .slice(0, 8)
    .map((g) => {
      const url = BASE + g.url.replace(/^\/+/, "");
      return `<a href="${url}">${g.title} — <span style="opacity:.75">${g.genre}</span></a>`;
    })
    .join("");
};

const filterAllGames = (query) => {
  const q = normalize(query);
  if (!q) return [];
  return ALL_GAMES.filter((g) => {
    const hay = normalize((g.title || "") + " " + (g.desc || "") + " " + (g.genre || ""));
    return hay.includes(q);
  });
};

// لود دیتای بازی‌ها
fetch(GAMES_JSON_URL)
  .then((r) => r.json())
  .then((data) => {
    ALL_GAMES = Array.isArray(data) ? data : [];
  })
  .catch(() => {
    // اگر فایل نبود یا مسیر غلط بود
    ALL_GAMES = [];
  });

// تایپ => نمایش نتایج کل سایت
if (searchInput) {
  searchInput.addEventListener("input", () => {
    const items = filterAllGames(searchInput.value);
    renderResults(items, searchInput.value);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchInput.value = "";
      renderResults([], "");
    }
  });
}

// کلیک بیرون => بستن لیست نتایج
document.addEventListener("click", (e) => {
  if (resultsBox && !resultsBox.contains(e.target) && !searchWrap.contains(e.target)) {
    resultsBox.hidden = true;
  }
});


